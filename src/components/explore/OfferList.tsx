
import { useExploreOffers } from "@/hooks/useExploreOffers"
import OfferCard from "./OfferCard"
import { Suspense, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { useCurrentUserProfile, sortOffersByRelevance } from "@/utils/offerSort"

interface OfferListProps {
  sortByRelevance?: boolean
}

const OfferListSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-lg"></div>
    ))}
  </div>
)

const OfferList = ({ sortByRelevance = false }: OfferListProps) => {
  const { offers, isLoading } = useExploreOffers()
  const { data: userProfile } = useCurrentUserProfile()
  const queryClient = useQueryClient()

  // Set up real-time subscription for offer changes
  useEffect(() => {
    const channel = supabase
      .channel('offer-list-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers'
        },
        (payload) => {
          console.log('Offer list update received:', payload)
          queryClient.invalidateQueries({ queryKey: ['offers'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

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

  // Filter out offers created by the current user
  const filteredOffers = offers.filter(offer => 
    offer.user.id !== userProfile?.id
  )

  if (filteredOffers.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No offers found from other users
      </div>
    )
  }

  // Apply sorting if enabled and user has services
  const displayedOffers = sortByRelevance && userProfile?.services
    ? sortOffersByRelevance(filteredOffers, userProfile.services)
    : filteredOffers

  return (
    <Suspense fallback={<OfferListSkeleton />}>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {displayedOffers.map((offer) => (
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
