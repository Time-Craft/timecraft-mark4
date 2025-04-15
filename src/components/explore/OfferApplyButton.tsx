
import { Button } from "@/components/ui/button"
import { Check, Gift, Hourglass } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"

interface OfferApplyButtonProps {
  offerId: string
  status: string
  isApplied?: boolean
  applicationStatus?: string
  userApplication?: any
  onApply: (offerId: string) => void
  isApplying: boolean
  timeCredits?: number
}

const OfferApplyButton = ({ 
  offerId, 
  status, 
  isApplied, 
  applicationStatus, 
  userApplication, 
  onApply, 
  isApplying,
  timeCredits = 1  // Default to 1 if not provided
}: OfferApplyButtonProps) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isClaiming, setIsClaiming] = useState(false)
  const [isClaimed, setIsClaimed] = useState(false)

  // Check if this transaction has already been claimed
  useEffect(() => {
    const checkIfClaimed = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('claimed')
        .eq('offer_id', offerId)
        .single()
      
      if (data && !error) {
        setIsClaimed(data.claimed === true)
      }
    }

    if (isApplied && status === 'completed' && (applicationStatus === 'accepted' || userApplication?.status === 'accepted')) {
      checkIfClaimed()
    }
  }, [offerId, isApplied, status, applicationStatus, userApplication?.status])

  const handleClaim = async () => {
    try {
      setIsClaiming(true)
      console.log('Claiming credits:', timeCredits)
      
      // Get current user to verify they are the service provider
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      // First check if this transaction exists and if user is the provider
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('offer_id', offerId)
        .single()
        
      if (fetchError) {
        // Transaction doesn't exist yet, create it
        const { data: offer } = await supabase
          .from('offers')
          .select('profile_id, time_credits')
          .eq('id', offerId)
          .single()
          
        if (!offer) throw new Error('Offer not found')
        
        // Create a new transaction record
        const { error: createError } = await supabase
          .from('transactions')
          .insert({
            offer_id: offerId,
            user_id: offer.profile_id,
            provider_id: user.id,
            hours: timeCredits,
            service: 'Time Exchange',
            claimed: true
          })
          
        if (createError) throw createError
      } else {
        // Transaction exists, verify provider and update
        if (transaction.provider_id !== user.id) {
          throw new Error('You are not the service provider for this offer')
        }
        
        const { error } = await supabase
          .from('transactions')
          .update({ 
            claimed: true,
            hours: timeCredits  // Ensure we use the actual credits from the offer
          })
          .eq('offer_id', offerId)
          
        if (error) throw error
      }

      toast({
        title: "Success",
        description: `${timeCredits} credit${timeCredits !== 1 ? 's' : ''} have been claimed successfully!`,
      })

      // Set local state to show claimed status
      setIsClaimed(true)

      // Invalidate relevant queries to trigger real-time updates
      queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
      queryClient.invalidateQueries({ queryKey: ['time-balance'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      queryClient.invalidateQueries({ queryKey: ['completed-offers'] })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to claim credits: " + error.message,
      })
      console.error('Claim error:', error)
    } finally {
      setIsClaiming(false)
    }
  }
  
  // Only show claim button for service providers (applicants) when the offer is completed
  if (isApplied && status === 'completed' && (applicationStatus === 'accepted' || userApplication?.status === 'accepted')) {
    return (
      <Button 
        onClick={handleClaim}
        disabled={isClaiming || isClaimed}
        className={`w-full md:w-auto mt-4 md:mt-0 ${
          isClaimed 
            ? 'bg-gray-400 hover:bg-gray-400' 
            : 'bg-green-500 hover:bg-green-600'
        } text-white`}
      >
        <Gift className="h-4 w-4 mr-1" />
        {isClaiming ? 'Claiming...' : isClaimed ? 'Credits Claimed' : 'Claim Credits'}
      </Button>
    )
  }
  
  if (isApplied) {
    const appStatus = applicationStatus || 'pending'
    
    const statusColorClass = appStatus === 'pending' 
      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
      : appStatus === 'accepted'
        ? 'bg-green-100 text-green-800 border-green-300'
        : 'bg-red-100 text-red-800 border-red-300'
      
    return (
      <Button 
        disabled 
        variant="secondary"
        className={`w-full md:w-auto mt-4 md:mt-0 ${statusColorClass}`}
      >
        <Hourglass className="h-4 w-4 mr-1" />
        {appStatus === 'pending' ? 'Application Pending' : 
         appStatus === 'accepted' ? 'Application Accepted' : 
         'Application Rejected'}
      </Button>
    )
  }

  if (userApplication) {
    const statusColorClass = userApplication.status === 'pending' 
      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
      : userApplication.status === 'accepted'
        ? 'bg-green-100 text-green-800 border-green-300'
        : 'bg-red-100 text-red-800 border-red-300';

    return (
      <Button 
        disabled 
        variant="secondary"
        className={`w-full md:w-auto mt-4 md:mt-0 ${statusColorClass}`}
      >
        <Hourglass className="h-4 w-4 mr-1" />
        {userApplication.status === 'pending' ? 'Application Pending' : 
          userApplication.status === 'accepted' ? 'Application Accepted' : 
          'Application Rejected'}
      </Button>
    )
  }

  return (
    <Button 
      onClick={() => onApply(offerId)}
      disabled={status !== 'available' || isApplying}
      className="w-full md:w-auto mt-4 md:mt-0 bg-teal hover:bg-teal/90 text-cream"
    >
      <Check className="h-4 w-4 mr-1" />
      {status === 'available' ? 'Apply' : 'Not Available'}
    </Button>
  )
}

export default OfferApplyButton
