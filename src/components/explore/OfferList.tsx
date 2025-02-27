
import { useExploreOffers } from "@/hooks/useExploreOffers"
import OfferCard from "./OfferCard"
import { Suspense, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { useCurrentUserProfile, sortOffersByRelevance } from "@/utils/offerSort"
import { useApplicationManagement } from "@/hooks/useApplicationManagement"

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
  
  // Get all applications for the current user to filter out applied offers
  const { userApplications } = useApplicationManagement()

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

  // Get the IDs of offers the user has already applied to
  const appliedOfferIds = userApplications?.map(app => app.offer_id) || []
  
  // Filter out offers the user has already applied to
  const unappliedOffers = filteredOffers.filter(offer => 
    !appliedOfferIds.includes(offer.id)
  )

  // Apply sorting if enabled and user has services
  const sortedOffers = sortByRelevance && userProfile?.services
    ? sortOffersByRelevance(unappliedOffers, userProfile.services)
    : unappliedOffers

  // Limit to top 5 if sorting by relevance is enabled
  const displayedOffers = sortByRelevance 
    ? sortedOffers.slice(0, 5) 
    : sortedOffers

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
