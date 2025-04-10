
-- Create or update the function to handle time balance updates when offers are created or updated
CREATE OR REPLACE FUNCTION public.update_time_balance_on_offer()
RETURNS TRIGGER AS $$
BEGIN
    -- Deduct time credits from the user's balance when an offer is created
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.time_balances
        SET 
            balance = balance - NEW.time_credits,
            updated_at = now()
        WHERE user_id = NEW.profile_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger on the offers table
DROP TRIGGER IF EXISTS update_time_balance_on_offer_create ON public.offers;
CREATE TRIGGER update_time_balance_on_offer_create
BEFORE INSERT ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.update_time_balance_on_offer();
