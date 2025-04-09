
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
        () => {
          console.log('Offer change detected')
          queryClient.invalidateQueries({ queryKey: ['offers'] })
          queryClient.invalidateQueries({ queryKey: ['user-offers'] })
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
          queryClient.invalidateQueries({ queryKey: ['user-stats'] })
        }
      )
      .subscribe()

    // Add subscription to time_balances table to update in real-time
    const timeBalancesChannel = supabase
      .channel('time-balances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_balances'
        },
        () => {
          console.log('Time balance change detected')
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(timeBalancesChannel)
    }
  }, [queryClient])

  const createOffer = useMutation({
    mutationFn: async (offer: OfferInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // First, check if the user has enough credits
      const { data: timeBalanceData, error: timeBalanceError } = await supabase
        .from('time_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single()
        
      if (timeBalanceError) throw timeBalanceError
      
      // Each time_credit costs 1 balance point
      if (timeBalanceData.balance < offer.timeCredits) {
        throw new Error(`Insufficient credits. You need ${offer.timeCredits} but only have ${timeBalanceData.balance}.`)
      }

      // Create the offer
      const { error, data } = await supabase
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
        .select()
      
      if (error) throw error

      // Update the time balance (deduct 1 point per time_credit)
      const { error: updateError } = await supabase
        .from('time_balances')
        .update({ 
          balance: timeBalanceData.balance - offer.timeCredits, // Deduct exactly the number of timeCredits
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
      
      if (updateError) throw updateError
      
      return data
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Request created successfully",
      })
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['user-offers'] })
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['time-balance'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create request: " + error.message,
        variant: "destructive",
      })
    }
  })

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
    isDeleting: deleteOffer.isPending
  }
}
