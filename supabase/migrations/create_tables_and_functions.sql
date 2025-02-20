
-- Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    services TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create time_transactions table
CREATE TABLE public.time_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    amount INTEGER NOT NULL,
    service_type TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    recipient_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- Create time_balances table
CREATE TABLE public.time_balances (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    balance INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create offer_interactions table
CREATE TABLE public.offer_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id UUID REFERENCES time_transactions(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    interaction_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_interaction_type CHECK (interaction_type IN ('view', 'click', 'save'))
);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create initial profile
    INSERT INTO public.profiles (id, username, services)
    VALUES (new.id, new.email, ARRAY[]::TEXT[]);

    -- Create initial time balance
    INSERT INTO public.time_balances (user_id, balance)
    VALUES (new.id, 30);

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update time balances
CREATE OR REPLACE FUNCTION public.update_time_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status = 'pending' THEN
        -- Deduct from sender
        UPDATE public.time_balances
        SET balance = balance - NEW.amount,
            updated_at = now()
        WHERE user_id = NEW.user_id;

        -- Add to recipient
        UPDATE public.time_balances
        SET balance = balance + NEW.amount,
            updated_at = now()
        WHERE user_id = NEW.recipient_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for time balance updates
CREATE TRIGGER on_transaction_status_change
    AFTER UPDATE OF status ON public.time_transactions
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.update_time_balance();

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: viewable by all, but only editable by the owner
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Time Transactions: viewable by sender and recipient
CREATE POLICY "Transactions viewable by participants"
    ON public.time_transactions FOR SELECT
    USING (auth.uid() IN (user_id, recipient_id));

CREATE POLICY "Users can create transactions"
    ON public.time_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Participants can update transaction status"
    ON public.time_transactions FOR UPDATE
    USING (auth.uid() IN (user_id, recipient_id));

-- Time Balances: viewable by owner
CREATE POLICY "Users can view own balance"
    ON public.time_balances FOR SELECT
    USING (auth.uid() = user_id);

-- Offer Interactions: viewable by offer owner and interacting user
CREATE POLICY "Interactions viewable by participants"
    ON public.offer_interactions FOR SELECT
    USING (
        auth.uid() = user_id OR 
        auth.uid() IN (
            SELECT user_id FROM time_transactions WHERE id = transaction_id
        )
    );

CREATE POLICY "Users can create interactions"
    ON public.offer_interactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Enable realtime subscriptions for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_balances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offer_interactions;
