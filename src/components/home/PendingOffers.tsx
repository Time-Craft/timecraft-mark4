
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePendingOffers } from "@/hooks/usePendingOffers"
import OfferCard from "../explore/OfferCard"
import { useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"

const PendingOffers = () => {
  const { pendingOffers, isLoading } = usePendingOffers()
  const queryClient = useQueryClient()

  // Set up real-time subscription for offer and application changes
  useEffect(() => {
    const offerChannel = supabase
      .channel('pending-offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
        }
      )
      .subscribe()

    const applicationChannel = supabase
      .channel('applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offer_applications'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(offerChannel)
      supabase.removeChannel(applicationChannel)
    }
  }, [queryClient])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Offers & Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div>Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (!pendingOffers || pendingOffers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Offers & Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            No pending offers or applications found
          </p>
        </CardContent>
      </Card>
    )
  }

  // Group offers by type (my offers vs applied offers)
  const myOffers = pendingOffers.filter(offer => !offer.isApplied)
  const appliedOffers = pendingOffers.filter(offer => offer.isApplied)

  return (
    <Card className="gradient-border card-hover">
      <CardHeader>
        <CardTitle className="text-navy">My Offers & Applications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {myOffers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">My Pending Offers</h3>
              <div className="space-y-4">
                {myOffers.map((offer) => (
                  <OfferCard 
                    key={offer.id} 
                    offer={offer}
                  />
                ))}
              </div>
            </div>
          )}
          
          {appliedOffers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">My Applications</h3>
              <div className="space-y-4">
                {appliedOffers
                  .filter(offer => offer.status !== 'completed')
                  .map((offer) => (
                    <OfferCard 
                      key={offer.id}
                      offer={offer}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default PendingOffers
