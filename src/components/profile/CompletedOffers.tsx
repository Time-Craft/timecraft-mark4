
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { User } from "lucide-react"
import { CompletedOfferCard } from "./CompletedOfferCard"

interface CompletedOffersProps {
  userId: string | null
  username?: string
  avatar?: string
}

interface CompletedOffer {
  id: string
  title: string
  description: string
  service_type: string
  time_credits: number
  hours: number
  created_at: string
  provider_username?: string
}

const CompletedOffers = ({ userId }: CompletedOffersProps) => {
  // Fetch offers completed FOR the user (user made the request)
  const { data: completedForYou, isLoading: forYouLoading } = useQuery({
    queryKey: ['completed-offers', userId, 'for-you'],
    queryFn: async () => {
      if (!userId) return []
      
      // Get transactions where user requested the service
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          service,
          hours,
          created_at,
          provider_id,
          offer_id
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching completed offers for you:', error)
        throw error
      }

      // For each transaction, get the offer and provider details
      const offerDetails = await Promise.all(
        data.map(async (transaction) => {
          try {
            if (!transaction.offer_id) return null
            
            // Fetch offer details
            const { data: offerData, error: offerError } = await supabase
              .from('offers')
              .select('title, description, time_credits, service_type')
              .eq('id', transaction.offer_id)
              .maybeSingle()
              
            if (offerError) {
              console.error('Error fetching offer details:', offerError)
              return null
            }
            
            if (!offerData) return null
            
            // Fetch provider username
            const { data: providerData, error: providerError } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', transaction.provider_id)
              .maybeSingle()
              
            if (providerError) {
              console.error('Error fetching provider username:', providerError)
              return null
            }
            
            return {
              id: transaction.id,
              title: offerData.title || 'Untitled',
              description: offerData.description || 'No description',
              service_type: offerData.service_type || transaction.service,
              time_credits: offerData.time_credits || 0,
              hours: transaction.hours,
              created_at: transaction.created_at,
              provider_username: providerData?.username || 'Unknown'
            }
          } catch (err) {
            console.error('Error processing transaction:', err)
            return null
          }
        })
      )

      // Filter out nulls and remove duplicates
      return offerDetails.filter(Boolean) as CompletedOffer[]
    },
    enabled: !!userId
  })

  if (forYouLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    )
  }

  if (!completedForYou?.length) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No completed services found
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {completedForYou.map((offer) => (
        <CompletedOfferCard
          key={offer.id}
          offer={offer}
          isForYou={true}
        />
      ))}
    </div>
  )
}

export default CompletedOffers
