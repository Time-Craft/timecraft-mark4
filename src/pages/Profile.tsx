import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import OfferCard from "@/components/explore/OfferCard"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const Profile = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user?.id) {
        setUserId(data.user.id)
      }
    }
    
    fetchUserId()
  }, [])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        () => {
          console.log('Profile update received')
          queryClient.invalidateQueries({ queryKey: ['profile', userId] })
        }
      )
      .subscribe()

    const timeBalanceChannel = supabase
      .channel('profile-time-balance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_balances',
          filter: `user_id=eq.${userId}`
        },
        () => {
          console.log('Time balance update received on profile page')
          queryClient.invalidateQueries({ queryKey: ['time-balance', userId] })
        }
      )
      .subscribe()

    const offersChannel = supabase
      .channel('profile-offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers',
          filter: `profile_id=eq.${userId}`
        },
        () => {
          console.log('Offers update received on profile page')
          queryClient.invalidateQueries({ queryKey: ['user-offers', userId] })
          queryClient.invalidateQueries({ queryKey: ['time-balance', userId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(timeBalanceChannel)
      supabase.removeChannel(offersChannel)
    }
  }, [queryClient, userId])

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!userId
  })

  const { data: userOffers, isLoading: userOffersLoading } = useQuery({
    queryKey: ['user-offers', userId],
    queryFn: async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('User offers in profile page:', data)
      return data
    },
    enabled: !!userId
  })

  const calculateTimeBalance = () => {
    const INITIAL_CREDITS = 30;
    
    if (userOffersLoading || !userOffers) {
      return INITIAL_CREDITS;
    }
    
    const usedCredits = userOffers.reduce((sum, offer) => 
      sum + (offer.time_credits || 0), 0);
    
    return INITIAL_CREDITS - usedCredits;
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      queryClient.clear()
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error logging out",
        description: error.message,
      })
    }
  }

  if (!userId) {
    return (
      <div className="container mx-auto p-4 space-y-6 max-w-2xl">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-4xl font-bold">Profile</h1>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex justify-center">
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>
            <div className="space-y-2 mt-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-4xl font-bold">Profile</h1>
        <div className="flex items-center gap-4">
          {userOffersLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <div className="text-sm font-medium">
              <span className="text-teal">{calculateTimeBalance()}</span> credits available
            </div>
          )}
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            {profileLoading ? (
              <Skeleton className="h-16 w-16 md:h-20 md:w-20 rounded-full" />
            ) : (
              <Avatar className="h-16 w-16 md:h-20 md:w-20">
                <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>
                  {profile?.username?.substring(0, 2).toUpperCase() || 'UN'}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              {profileLoading ? (
                <Skeleton className="h-8 w-40" />
              ) : (
                <CardTitle className="text-xl md:text-2xl">
                  {profile?.username || 'Username not set'}
                </CardTitle>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Interests</h3>
              {profileLoading ? (
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.services?.map((service: string) => (
                    <span
                      key={service}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-secondary text-secondary-foreground"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>My Requests</CardTitle>
            <Button 
              size="sm" 
              onClick={() => navigate('/offer')}
              disabled={userOffersLoading || calculateTimeBalance() <= 0}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Request
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userOffersLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
            ) : userOffers?.length === 0 ? (
              <p className="text-center text-muted-foreground">
                You haven't created any requests yet
              </p>
            ) : (
              userOffers?.map((offer) => (
                <OfferCard 
                  key={offer.id} 
                  offer={{
                    ...offer,
                    timeCredits: offer.time_credits,
                    user: {
                      id: offer.profile_id,
                      name: profile?.username || 'Unknown',
                      avatar: profile?.avatar_url || '/placeholder.svg'
                    }
                  }}
                  showApplications={true}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Profile
