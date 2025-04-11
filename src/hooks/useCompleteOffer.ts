
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export const useCompleteOffer = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const completeOffer = useMutation({
    mutationFn: async (offerId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Update the offer status to completed
      const { error } = await supabase
        .from('offers')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId)
        .eq('profile_id', user.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Offer marked as completed and credits transferred",
      })
      queryClient.invalidateQueries({ queryKey: ['user-offers'] })
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['time-balance'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete offer: " + error.message,
        variant: "destructive",
      })
    }
  })

  return {
    completeOffer: completeOffer.mutate,
    isCompleting: completeOffer.isPending
  }
}
