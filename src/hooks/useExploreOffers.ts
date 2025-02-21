
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'

interface Offer {
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

export const useExploreOffers = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')

  // Enhanced query with real-time invalidation
  const { data: offers, isLoading } = useQuery({
    queryKey: ['offers', searchQuery],
    queryFn: async () => {
      const query = supabase
        .from('offers')
        .select(`
          id,
          title,
          description,
          hours,
          status,
          profiles!offers_profile_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('status', 'available')
        
      if (searchQuery) {
        query.ilike('title', `%${searchQuery}%`)
      }
      
      const { data, error } = await query
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
      })) as Offer[]
    },
  })

  // Real-time subscription setup
  useEffect(() => {
    const channel = supabase
      .channel('offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers'
        },
        (payload) => {
          console.log('Real-time update received:', payload)
          queryClient.invalidateQueries({ queryKey: ['offers'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  const acceptOffer = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from('offers')
        .update({ status: 'pending' })
        .eq('id', offerId)
      
      if (error) throw error

      // Immediately invalidate queries to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Offer accepted successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to accept offer: ${error.message}`,
      })
    }
  })

  return {
    offers,
    isLoading,
    searchQuery,
    setSearchQuery,
    acceptOffer: acceptOffer.mutate
  }
}
