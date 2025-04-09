
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

const StatsCards = () => {
  const queryClient = useQueryClient()
  const [userId, setUserId] = useState<string | null>(null)

  // First fetch the user ID
  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user?.id) {
        setUserId(data.user.id)
      }
    }
    
    fetchUserId()
  }, [])

  // Set up the real-time subscription with proper user ID
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('user-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stats',
          filter: `user_id=eq.${userId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-stats', userId] })
        }
      )
      .subscribe()

    // Time balance subscription
    const timeBalanceChannel = supabase
      .channel('stats-time-balance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_balances',
          filter: `user_id=eq.${userId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['time-balance', userId] })
          queryClient.invalidateQueries({ queryKey: ['user-stats', userId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(timeBalanceChannel)
    }
  }, [queryClient, userId])

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats', userId],
    queryFn: async () => {
      if (!userId) return null
      
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!userId // Only run query when userId is available
  })

  // Get time balance from the time_balances table
  const { data: timeBalance, isLoading: timeBalanceLoading } = useQuery({
    queryKey: ['time-balance', userId],
    queryFn: async () => {
      if (!userId) return null
      
      const { data, error } = await supabase
        .from('time_balances')
        .select('balance')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      
      return data
    },
    enabled: !!userId // Only run query when userId is available
  })

  const isLoading = statsLoading || timeBalanceLoading

  const statsData = [
    {
      title: "Total Exchanges",
      value: stats?.total_exchanges?.toString() || "0",
      description: "Time exchanges completed"
    },
    {
      title: "Average Rating",
      value: stats?.average_rating?.toFixed(1).toString() || "0.0",
      description: "Out of 5 stars"
    },
    {
      title: "Most Requested",
      value: stats?.most_offered_service || "N/A",
      description: "Your top service"
    },
    {
      title: "Community Rank",
      value: `#${stats?.community_rank || "0"}`,
      description: "Among active users"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat) => (
        <Card key={stat.title} className="gradient-border card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-navy">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold text-navy">{stat.value}</div>
                <p className="text-xs text-teal mt-1">
                  {stat.description}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default StatsCards
