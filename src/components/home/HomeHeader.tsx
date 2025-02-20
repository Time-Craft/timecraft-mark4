
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

const HomeHeader = () => {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data
    }
  })

  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold">
        Welcome to TimeCraft, {profile?.username || 'Guest'}
      </h1>
      <p className="text-muted-foreground mt-2">
        Here's what's happening with your time exchanges
      </p>
    </div>
  )
}

export default HomeHeader
