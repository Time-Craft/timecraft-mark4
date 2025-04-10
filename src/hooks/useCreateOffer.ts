
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'

interface OfferInput {
  title: string
  description: string
  hours: number
  serviceType: string
  date?: string
  duration: number
  timeCredits: number 
}

export const useCreateOffer = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const createOffer = useMutation({
    mutationFn: async (offer: OfferInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get all user offers to calculate available credits
      const { data: userOffers, error: offersError } = await supabase
        .from('offers')
        .select('time_credits')
        .eq('profile_id', user.id)
        
      if (offersError) throw offersError
      
      // Calculate current available credits
      const INITIAL_CREDITS = 30
      const usedCredits = userOffers.reduce((sum, userOffer) => 
        sum + (userOffer.time_credits || 0), 0)
      const availableCredits = INITIAL_CREDITS - usedCredits
      
      console.log(`Checking credit balance: Available ${availableCredits}, needs ${offer.timeCredits}`)
      
      if (availableCredits < offer.timeCredits) {
        throw new Error(`Insufficient credits. You need ${offer.timeCredits} but only have ${availableCredits} available.`)
      }

      console.log('Creating offer with data:', {
        title: offer.title,
        description: offer.description,
        hours: offer.duration,
        time_credits: offer.timeCredits,
        service_type: offer.serviceType,
        duration: offer.duration
      })

      const { error, data } = await supabase
        .from('offers')
        .insert([{ 
          title: offer.title,
          description: offer.description,
          hours: offer.duration,
          time_credits: offer.timeCredits,
          service_type: offer.serviceType,
          date: offer.date,
          duration: offer.duration,
          status: 'available',
          profile_id: user.id,
          created_at: new Date().toISOString()
        }])
        .select()
      
      if (error) throw error
      
      return data
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Request created successfully",
      })
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

  return {
    createOffer: createOffer.mutate,
    isCreating: createOffer.isPending
  }
}
