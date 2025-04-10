
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export const useDeleteOffer = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const deleteOffer = useMutation({
    mutationFn: async (offerId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // First, fetch the offer to get the time_credits value
      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .select('time_credits')
        .eq('id', offerId)
        .eq('profile_id', user.id)
        .single()
      
      if (offerError) throw offerError
      
      // Get current time balance
      const { data: timeBalanceData, error: timeBalanceError } = await supabase
        .from('time_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single()
      
      if (timeBalanceError) throw timeBalanceError
      
      // Delete the offer
      const { error: deleteError } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId)
        .eq('profile_id', user.id)
      
      if (deleteError) throw deleteError
      
      // Refund the credits
      console.log(`Refunding credits: ${timeBalanceData.balance} + ${offerData.time_credits} = ${timeBalanceData.balance + offerData.time_credits}`)
      
      const { error: updateError } = await supabase
        .from('time_balances')
        .update({ 
          balance: timeBalanceData.balance + offerData.time_credits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
      
      if (updateError) {
        console.error('Error updating time balance:', updateError)
        throw updateError
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Offer deleted successfully",
      })
      queryClient.invalidateQueries({ queryKey: ['user-offers'] })
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['time-balance'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
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
    deleteOffer: deleteOffer.mutate,
    isDeleting: deleteOffer.isPending
  }
}
