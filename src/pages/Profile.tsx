import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import OfferCard from "@/components/explore/OfferCard"

const OFFER_STATUSES = {
  AVAILABLE: 'available',
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

const Profile = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [services, setServices] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5
  })

  useEffect(() => {
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile?.id}`
        },
        (payload) => {
          queryClient.setQueryData(['profile'], payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, queryClient])

  const updateProfileMutation = useMutation({
    mutationFn: async ({ username, services }: { username: string, services: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          services,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error
    },
    onMutate: async ({ username, services }) => {
      await queryClient.cancelQueries({ queryKey: ['profile'] })
      const previousProfile = queryClient.getQueryData(['profile'])

      queryClient.setQueryData(['profile'], (old: any) => ({
        ...old,
        username,
        services
      }))

      return { previousProfile }
    },
    onError: (err, newProfile, context) => {
      queryClient.setQueryData(['profile'], context?.previousProfile)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    }
  })

  const { data: userOffers } = useQuery({
    queryKey: ['user-offers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5
  })

  useEffect(() => {
    const channel = supabase
      .channel('user-offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers',
          filter: `profile_id=eq.${profile?.id}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            queryClient.setQueryData(['user-offers'], (old: any[]) => 
              old?.filter(offer => offer.id !== payload.old.id)
            )
          } else if (payload.eventType === 'INSERT') {
            queryClient.setQueryData(['user-offers'], (old: any[]) => 
              [payload.new, ...(old || [])]
            )
          } else if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData(['user-offers'], (old: any[]) => 
              old?.map(offer => offer.id === payload.new.id ? payload.new : offer)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, queryClient])

  const deleteOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const { error: updateError } = await supabase
        .from('offers')
        .update({ 
          status: OFFER_STATUSES.CANCELLED,
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId)

      if (updateError) throw updateError

      const { error: deleteError } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId)

      if (deleteError) throw deleteError
    },
    onMutate: async (offerId) => {
      await queryClient.cancelQueries({ queryKey: ['user-offers'] })
      const previousOffers = queryClient.getQueryData(['user-offers'])
      
      queryClient.setQueryData(['user-offers'], (old: any[]) => 
        old?.filter(offer => offer.id !== offerId)
      )

      return { previousOffers }
    },
    onError: (err, offerId, context) => {
      queryClient.setQueryData(['user-offers'], context?.previousOffers)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete offer: ${err.message}`
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Offer deleted successfully"
      })
    }
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateProfileMutation.mutateAsync({
        username,
        services: services.split(',').map(s => s.trim())
      })

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated"
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteOffer = (offerId: string) => {
    return () => {
      deleteOfferMutation.mutate(offerId)
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-4xl font-bold">Profile</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 md:h-20 md:w-20">
              <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>
                {username?.substring(0, 2).toUpperCase() || 'UN'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl md:text-2xl">User Profile</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Services Offered</label>
              <Input 
                value={services}
                onChange={(e) => setServices(e.target.value)}
                placeholder="e.g., Programming, Teaching, Gardening" 
              />
              <p className="text-sm text-muted-foreground">
                Separate multiple services with commas
              </p>
            </div>
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>My Offers</CardTitle>
            <Button size="sm" onClick={() => navigate('/offer')}>
              <Plus className="h-4 w-4 mr-1" />
              New Offer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userOffers?.length === 0 ? (
              <p className="text-center text-muted-foreground">
                You haven't created any offers yet
              </p>
            ) : (
              userOffers?.map((offer) => (
                <OfferCard 
                  key={offer.id} 
                  offer={{
                    ...offer,
                    user: {
                      id: offer.profile_id,
                      name: profile?.username || 'Unknown',
                      avatar: profile?.avatar_url || '/placeholder.svg'
                    }
                  }}
                  showApplications={true}
                  onDelete={handleDeleteOffer(offer.id)}
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
