
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface PendingOffer {
  id: string
  title: string
  description: string
  hours: number
  timeCredits?: number
  user: {
    id: string
    name: string
    avatar: string
  }
  status: string
  isApplied?: boolean
  applicationStatus?: string
}

export const usePendingOffers = () => {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['pending-offers-and-applications'],
    queryFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get pending offers
      const { data: pendingOffersData, error: pendingError } = await supabase
        .from('offers')
        .select(`
          *,
          profiles!offers_profile_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('status', 'pending')
        .eq('profile_id', user.id)
      
      if (pendingError) throw pendingError

      // Get offers the user has applied to
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('offer_applications')
        .select(`
          *,
          offers (
            *,
            profiles!offers_profile_id_fkey (
              id,
              username,
              avatar_url
            )
          )
        `)
        .eq('applicant_id', user.id)
      
      if (applicationsError) throw applicationsError

      // Transform pending offers
      const pendingOffers = pendingOffersData.map(offer => ({
        id: offer.id,
        title: offer.title,
        description: offer.description,
        hours: offer.hours,
        timeCredits: offer.time_credits,
        status: offer.status,
        isApplied: false,
        user: {
          id: offer.profiles?.id || '',
          name: offer.profiles?.username || 'Unknown User',
          avatar: offer.profiles?.avatar_url || '/placeholder.svg'
        }
      }));

      // Transform applied offers
      const appliedOffers = applicationsData.map(application => {
        const offer = application.offers;
        return {
          id: offer.id,
          title: offer.title,
          description: offer.description,
          hours: offer.hours,
          timeCredits: offer.time_credits,
          status: offer.status,
          isApplied: true,
          applicationStatus: application.status,
          user: {
            id: offer.profiles?.id || '',
            name: offer.profiles?.username || 'Unknown User',
            avatar: offer.profiles?.avatar_url || '/placeholder.svg'
          }
        };
      });

      // Combine both types of offers
      return [...pendingOffers, ...appliedOffers] as PendingOffer[]
    }
  })

  const completeOffer = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from('offers')
        .update({ status: 'completed' })
        .eq('id', offerId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
    }
  })

  return {
    pendingOffers: data,
    isLoading,
    completeOffer: completeOffer.mutate
  }
}
