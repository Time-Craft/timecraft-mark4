
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

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
  const formattedDate = offer.created_at
    ? formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })
    : 'Unknown date'
  
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
        </div>
      </CardContent>
    </Card>
  )
}
