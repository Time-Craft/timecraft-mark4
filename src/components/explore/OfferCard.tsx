
import { Card, CardContent } from "@/components/ui/card"
import OfferHeader from "./OfferHeader"
import OfferStatus from "./OfferStatus"
import { useApplicationManagement } from "@/hooks/useApplicationManagement"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useDeleteOffer } from "@/hooks/useDeleteOffer"
import { useCompleteOffer } from "@/hooks/useCompleteOffer"
import OfferApplyButton from "./OfferApplyButton"
import OfferOwnerActions from "./OfferOwnerActions"
import ApplicationsList from "./ApplicationsList"

interface OfferCardProps {
  offer: {
    id: string
    title: string
    description: string
    hours?: number
    timeCredits?: number
    user: {
      id: string
      name: string
      avatar: string
    }
    status: string
    service_type?: string
    accepted_by?: string[]
    isApplied?: boolean
    applicationStatus?: string
  }
  showApplications?: boolean
}

const OfferCard = ({ offer, showApplications = false }: OfferCardProps) => {
  const { toast } = useToast()
  const { deleteOffer, isDeleting } = useDeleteOffer()
  const { completeOffer, isCompleting } = useCompleteOffer()
  const { 
    applyToOffer, 
    applications, 
    updateApplicationStatus,
    userApplication,
    isApplying,
    isUpdating
  } = useApplicationManagement(offer.id)

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    }
  })

  const isOwner = currentUser?.id === offer.user.id

  const handleDelete = async () => {
    try {
      await deleteOffer(offer.id)
      toast({
        title: "Success",
        description: "Offer deleted successfully",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete offer: " + error.message,
      })
    }
  }

  const handleComplete = async () => {
    try {
      await completeOffer(offer.id)
      toast({
        title: "Success",
        description: "Offer marked as completed and credits transferred",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to complete offer: ${error.message}`,
      })
    }
  }

  const handleUpdateStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
    try {
      await updateApplicationStatus({ 
        applicationId, 
        status 
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${status} application: ${error.message}`,
      })
    }
  }

  // Check if this offer has any accepted applications
  const hasAcceptedApplication = applications?.some(app => app.status === 'accepted')

  return (
    <Card className="gradient-border card-hover">
      <CardContent className="p-6">
        <OfferHeader 
          user={offer.user} 
          title={offer.title} 
          hours={offer.hours}
          timeCredits={offer.timeCredits} 
        />
        <p className="mt-2 text-navy/80">{offer.description}</p>
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <OfferStatus status={offer.status || 'unknown'} />
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            {isOwner ? (
              <OfferOwnerActions 
                offerId={offer.id}
                status={offer.status}
                hasAcceptedApplication={hasAcceptedApplication}
                onDelete={handleDelete}
                onComplete={handleComplete}
                isDeleting={isDeleting}
                isCompleting={isCompleting}
              />
            ) : (
              <OfferApplyButton
                offerId={offer.id}
                status={offer.status}
                isApplied={offer.isApplied}
                applicationStatus={offer.applicationStatus}
                userApplication={userApplication}
                onApply={applyToOffer}
                isApplying={isApplying}
              />
            )}
          </div>
        </div>

        {showApplications && (
          <ApplicationsList 
            applications={applications || []}
            onUpdateStatus={handleUpdateStatus}
            isUpdating={isUpdating}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default OfferCard
