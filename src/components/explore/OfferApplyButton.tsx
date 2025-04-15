
import { Button } from "@/components/ui/button"
import { Check, Gift, Hourglass } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

interface OfferApplyButtonProps {
  offerId: string
  status: string
  isApplied?: boolean
  applicationStatus?: string
  userApplication?: any
  onApply: (offerId: string) => void
  isApplying: boolean
}

const OfferApplyButton = ({ 
  offerId, 
  status, 
  isApplied, 
  applicationStatus, 
  userApplication, 
  onApply, 
  isApplying 
}: OfferApplyButtonProps) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isClaiming, setIsClaiming] = useState(false)
  const [isClaimed, setIsClaimed] = useState(false)

  const handleClaim = async () => {
    try {
      setIsClaiming(true)
      
      const { error } = await supabase
        .from('transactions')
        .update({ claimed: true })
        .eq('offer_id', offerId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Credits have been claimed successfully!",
      })

      // Set local state to show claimed status
      setIsClaimed(true)

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
      queryClient.invalidateQueries({ queryKey: ['time-balance'] })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to claim credits: " + error.message,
      })
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
        {isClaimed ? 'Credits Claimed' : 'Claim Credits'}
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
