
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, User, Users } from "lucide-react"

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
  created_at: string
  completed_at: string
  provider_username?: string
  requester_username?: string
}

const CompletedOffers = ({ userId, username, avatar }: CompletedOffersProps) => {
  const [activeTab, setActiveTab] = useState<'by-you' | 'for-you'>('for-you')
  
  // Fetch offers completed BY the user (user was the service provider)
  const { data: completedByYou, isLoading: byYouLoading } = useQuery({
    queryKey: ['completed-offers', userId, 'by-you'],
    queryFn: async () => {
      if (!userId) return []
      
      // Get transactions where the user was the provider
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          service,
          hours,
          created_at,
          offer_id,
          offers!inner(
            title,
            description,
            service_type,
            time_credits,
            status,
            profiles!inner(
              username
            )
          )
        `)
        .eq('provider_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching completed offers by you:', error)
        throw error
      }

      // Transform the data to match our needs
      return data.map(transaction => ({
        id: transaction.id,
        title: transaction.offers.title,
        description: transaction.offers.description,
        service_type: transaction.service,
        time_credits: transaction.offers.time_credits,
        hours: transaction.hours,
        created_at: transaction.created_at,
        requester_username: transaction.offers.profiles.username
      }))
    },
    enabled: !!userId
  })
  
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
          offer_id,
          offers!inner(
            title,
            description,
            service_type,
            time_credits
          ),
          profiles!provider_id(
            username
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching completed offers for you:', error)
        throw error
      }

      // Transform the data to match our needs
      return data.map(transaction => ({
        id: transaction.id,
        title: transaction.offers.title,
        description: transaction.offers.description,
        service_type: transaction.service,
        time_credits: transaction.offers.time_credits,
        hours: transaction.hours,
        created_at: transaction.created_at,
        provider_username: transaction.profiles?.username || 'Unknown'
      }))
    },
    enabled: !!userId
  })

  return (
    <div>
      <Tabs defaultValue="for-you" onValueChange={(val) => setActiveTab(val as 'by-you' | 'for-you')}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="for-you" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            FOR YOU
          </TabsTrigger>
          <TabsTrigger value="by-you" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            BY YOU
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="for-you">
          <div className="space-y-4">
            {forYouLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
            ) : completedForYou?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No services have been completed for you yet
              </p>
            ) : (
              completedForYou?.map((offer) => (
                <CompletedOfferCard
                  key={offer.id}
                  offer={offer}
                  isForYou={true}
                />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="by-you">
          <div className="space-y-4">
            {byYouLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
            ) : completedByYou?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                You haven't completed any services yet
              </p>
            ) : (
              completedByYou?.map((offer) => (
                <CompletedOfferCard
                  key={offer.id}
                  offer={offer}
                  isForYou={false}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Component for displaying a completed offer card
const CompletedOfferCard = ({ 
  offer, 
  isForYou 
}: { 
  offer: CompletedOffer, 
  isForYou: boolean 
}) => {
  return (
    <Card className="gradient-border">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg text-navy">{offer.title}</h3>
            <p className="text-sm text-navy/80">{offer.description}</p>
          </div>
          <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="bg-mint/10 text-navy px-3 py-1 rounded-full text-xs">
            {offer.service_type}
          </div>
          <div className="bg-teal/10 text-teal px-3 py-1 rounded-full text-xs">
            {offer.time_credits} credits
          </div>
          <div className="bg-navy/10 text-navy px-3 py-1 rounded-full text-xs">
            {new Date(offer.created_at).toLocaleDateString()}
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-navy/10 text-sm">
          {isForYou ? (
            <p>Completed by: <span className="font-medium">{offer.provider_username}</span></p>
          ) : (
            <p>Requested by: <span className="font-medium">{offer.requester_username}</span></p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default CompletedOffers
