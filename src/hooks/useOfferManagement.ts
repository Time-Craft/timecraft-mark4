
import { useCreateOffer } from './useCreateOffer'
import { useUpdateOffer } from './useUpdateOffer'
import { useDeleteOffer } from './useDeleteOffer'
import { useOfferSubscription } from './useOfferSubscription'

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

  return {
    createOffer,
    updateOffer,
    deleteOffer,
    isCreating,
    isUpdating,
    isDeleting
  }
}
