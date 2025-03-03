
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useEffect } from 'react'

interface OfferInput {
  title: string
  description: string
  hours: number
  serviceType: string
  date?: string
  duration: number
  timeCredits: number
}

export const useOfferManagement = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Query to get the user's current time balance
  const { data: timeBalance } = useQuery({
    queryKey: ['time-balance'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('time_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single()
      
      if (error) throw error
      return data
    }
  })

  // Real-time subscription for offer changes
  useEffect(() => {
    const channel = supabase
      .channel('offer-management')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers'
        },
        (payload) => {
          console.log('Offer change detected:', payload)
          queryClient.invalidateQueries({ queryKey: ['offers'] })
          queryClient.invalidateQueries({ queryKey: ['user-offers'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  // Real-time subscription for time balance changes
  useEffect(() => {
    const channel = supabase
      .channel('time-balance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_balances'
        },
        (payload) => {
          console.log('Time balance change detected:', payload)
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  const createOffer = useMutation({
    mutationFn: async (offer: OfferInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Check if user has enough time credits
      const { data: balanceData, error: balanceError } = await supabase
        .from('time_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single()
      
      if (balanceError) throw balanceError
      
      if (!balanceData || balanceData.balance < offer.timeCredits) {
        throw new Error(`Insufficient time credits. You have ${balanceData?.balance || 0} credits, but the offer requires ${offer.timeCredits} credits.`)
      }

      const { error } = await supabase
        .from('offers')
        .insert([{ 
          title: offer.title,
          description: offer.description,
          hours: offer.duration, // Store the duration in hours
          time_credits: offer.timeCredits, // Store the time credits separately
          service_type: offer.serviceType,
          date: offer.date,
          duration: offer.duration,
          status: 'available',
          profile_id: user.id,
          created_at: new Date().toISOString()
        }])
      
      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Offer created successfully",
      })
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-offers'] })
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['time-balance'] })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create offer: " + error.message,
        variant: "destructive",
      })
    }
  })

  // Update function to track time credit changes
  const updateOffer = useMutation({
    mutationFn: async ({ id, ...offer }: OfferInput & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('offers')
        .update({ 
          title: offer.title,
          description: offer.description,
          hours: offer.duration, // Update the duration in hours
          time_credits: offer.timeCredits, // Update the time credits
          service_type: offer.serviceType,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('profile_id', user.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Offer updated successfully",
      })
      // Invalidate both queries
      queryClient.invalidateQueries({ queryKey: ['user-offers'] })
      queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update offer: " + error.message,
        variant: "destructive",
      })
    }
  })

  const deleteOffer = useMutation({
    mutationFn: async (offerId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId)
        .eq('profile_id', user.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Offer deleted successfully",
      })
      // Invalidate both queries immediately
      queryClient.invalidateQueries({ queryKey: ['user-offers'] })
      queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete offer: " + error.message,
        variant: "destructive",
      })
    }
  })

  return {
    createOffer: createOffer.mutate,
    updateOffer: updateOffer.mutate,
    deleteOffer: deleteOffer.mutate,
    isCreating: createOffer.isPending,
    isUpdating: updateOffer.isPending,
    isDeleting: deleteOffer.isPending,
    timeBalance: timeBalance?.balance || 0
  }
}
