
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface UserProfile {
  id: string
  services: string[]
}

interface Offer {
  id: string
  title: string
  description: string
  service_type: string
  status: string
  hours: number  // Added hours property to fix type error
  accepted_by?: string[]
  user: {
    id: string
    name: string
    avatar: string
  }
}

export const useCurrentUserProfile = () => {
  return useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('id, services')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data as UserProfile
    }
  })
}

export const calculateOfferScore = (
  offer: Offer,
  userServices: string[] = []
): number => {
  if (!userServices.length) return 0
  
  let score = 0

  // Count exact matches between user skills and offer service type
  if (userServices.includes(offer.service_type)) {
    score += 1
  }

  // Count shared skills with users who accepted the offer
  if (offer.accepted_by?.length) {
    score += offer.accepted_by.length
  }

  return score
}

export const sortOffersByRelevance = (
  offers: Offer[],
  userServices: string[] = []
): Offer[] => {
  if (!userServices.length) return offers

  return [...offers].sort((a, b) => {
    // First, prioritize available offers over other statuses
    if (a.status === 'available' && b.status !== 'available') {
      return -1;
    }
    if (a.status !== 'available' && b.status === 'available') {
      return 1;
    }
    
    // If both offers have the same status (either both available or both not available),
    // then sort by relevance score
    const scoreA = calculateOfferScore(a, userServices)
    const scoreB = calculateOfferScore(b, userServices)
    
    // Sort by score in descending order
    return scoreB - scoreA
  })
}
