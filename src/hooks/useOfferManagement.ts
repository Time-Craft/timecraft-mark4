
import { useCreateOffer } from './useCreateOffer'
import { useUpdateOffer } from './useUpdateOffer'
import { useDeleteOffer } from './useDeleteOffer'
import { useOfferSubscription } from './useOfferSubscription'
import { useCompleteOffer } from './useCompleteOffer'

export interface OfferInput {
  title: string
  description: string
  hours: number
  serviceType: string
  date?: string
  duration: number
  timeCredits: number 
}

export const useOfferManagement = () => {
  // Set up subscriptions for real-time updates
  useOfferSubscription()

  // Get all the individual hooks
  const { createOffer, isCreating } = useCreateOffer()
  const { updateOffer, isUpdating } = useUpdateOffer()
  const { deleteOffer, isDeleting } = useDeleteOffer()
  const { completeOffer, isCompleting } = useCompleteOffer()

  return {
    createOffer,
    updateOffer,
    deleteOffer,
    completeOffer,
    isCreating,
    isUpdating,
    isDeleting,
    isCompleting
  }
}
