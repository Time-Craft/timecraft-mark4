
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePendingOffers } from "@/hooks/usePendingOffers"
import OfferCard from "../explore/OfferCard"
import { Badge } from "@/components/ui/badge"

const PendingOffers = () => {
  const { pendingOffers, isLoading } = usePendingOffers()

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'accepted':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Accepted</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

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
                {appliedOffers.map((offer) => (
                  <div key={offer.id} className="relative">
                    <div className="absolute top-2 right-2 z-10">
                      {getStatusBadge(offer.applicationStatus || 'pending')}
                    </div>
                    <OfferCard 
                      offer={offer}
                    />
                  </div>
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
