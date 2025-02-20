
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface PendingOffer {
  id: string
  title: string
  description: string
  hours: number
  user: {
    id: string
    name: string
    avatar: string
  }
  status: string
}

export const usePendingOffers = () => {
  const queryClient = useQueryClient()

  const { data: pendingOffers, isLoading } = useQuery({
    queryKey: ['pending-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
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
      
      if (error) throw error

      return data.map(offer => ({
        id: offer.id,
        title: offer.title,
        description: offer.description,
        hours: offer.hours,
        status: offer.status,
        user: {
          id: offer.profiles?.id || '',
          name: offer.profiles?.username || 'Unknown User',
          avatar: offer.profiles?.avatar_url || '/placeholder.svg'
        }
      })) as PendingOffer[]
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
      queryClient.invalidateQueries({ queryKey: ['pending-offers'] })
    }
  })

  return {
    pendingOffers,
    isLoading,
    completeOffer: completeOffer.mutate
  }
}
