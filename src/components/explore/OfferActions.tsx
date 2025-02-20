
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface OfferActionsProps {
  offerId: string
  onAccept: () => void
}

const OfferActions = ({ offerId, onAccept }: OfferActionsProps) => {
  const { toast } = useToast()

  const handleAccept = async () => {
    try {
      onAccept()
      toast({
        title: "Success",
        description: "Offer accepted successfully",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    }
  }

  return (
    <div className="flex space-x-2">
      <Button 
        size="sm"
        onClick={handleAccept}
        className="bg-teal hover:bg-teal/90 text-cream"
      >
        <Check className="h-4 w-4 mr-1" />
        Accept
      </Button>
    </div>
  )
}

export default OfferActions
