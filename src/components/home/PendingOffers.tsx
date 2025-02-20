
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePendingOffers } from "@/hooks/usePendingOffers"
import OfferCard from "../explore/OfferCard"

const PendingOffers = () => {
  const { pendingOffers, isLoading } = usePendingOffers()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Offers</CardTitle>
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
          <CardTitle>Pending Offers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            No pending offers found
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gradient-border card-hover">
      <CardHeader>
        <CardTitle className="text-navy">Pending Offers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingOffers.map((offer) => (
            <OfferCard 
              key={offer.id} 
              offer={offer}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default PendingOffers
