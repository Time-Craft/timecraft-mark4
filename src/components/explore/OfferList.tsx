
import { useExploreOffers } from "@/hooks/useExploreOffers"
import OfferCard from "./OfferCard"
import { Suspense } from "react"

const OfferListSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-lg"></div>
    ))}
  </div>
)

const OfferList = () => {
  const { offers, isLoading } = useExploreOffers()

  if (isLoading) {
    return <OfferListSkeleton />
  }

  if (!offers || offers.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No offers found
      </div>
    )
  }

  return (
    <Suspense fallback={<OfferListSkeleton />}>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => (
          <OfferCard 
            key={offer.id} 
            offer={offer}
          />
        ))}
      </div>
    </Suspense>
  )
}

export default OfferList
