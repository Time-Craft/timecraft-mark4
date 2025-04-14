
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useState } from "react"

interface CompletedOfferCardProps {
  offer: {
    id: string
    title: string
    description: string
    service_type: string
    time_credits: number
    hours: number
    created_at: string
    provider_username?: string
  }
  isForYou: boolean
}

export const CompletedOfferCard = ({ offer, isForYou }: CompletedOfferCardProps) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isClaiming, setIsClaiming] = useState(false)
  
  const formattedDate = offer.created_at
    ? formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })
    : 'Unknown date'
  
  const handleClaim = async () => {
    try {
      setIsClaiming(true)
      
      const { error } = await supabase
        .from('transactions')
        .update({ claimed: true })
        .eq('id', offer.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Credits have been claimed successfully!",
      })

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['completed-offers'] })
      queryClient.invalidateQueries({ queryKey: ['time-balance'] })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to claim credits: " + error.message,
      })
    } finally {
      setIsClaiming(false)
    }
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="space-y-2 mb-4 md:mb-0">
            <h3 className="font-semibold">{offer.title}</h3>
            <p className="text-sm text-muted-foreground">{offer.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                {offer.service_type}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                {offer.time_credits} {offer.time_credits === 1 ? 'credit' : 'credits'}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Completed {formattedDate}
              </span>
            </div>
            {isForYou && offer.provider_username && (
              <p className="text-sm">Completed by: {offer.provider_username}</p>
            )}
          </div>
          
          <div className="flex items-center">
            <Button 
              onClick={handleClaim}
              disabled={isClaiming}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Gift className="h-4 w-4 mr-1" />
              Claim Credits
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
