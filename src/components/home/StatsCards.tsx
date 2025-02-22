
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

const StatsCards = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('user-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stats',
          filter: `user_id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-stats'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data
    }
  })

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
      title: "Most Offered",
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
            <div className="text-2xl font-bold text-navy">{stat.value}</div>
            <p className="text-xs text-teal mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default StatsCards
