
import { Badge } from "@/components/ui/badge"

interface OfferStatusProps {
  status: string
}

const OfferStatus = ({ status }: OfferStatusProps) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-500/10 text-green-500'
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'booked':
        return 'bg-blue-500/10 text-blue-500'
      case 'completed':
        return 'bg-blue-500/10 text-blue-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  return (
    <Badge 
      variant="secondary" 
      className={`${getStatusColor(status)} capitalize`}
    >
      {status}
    </Badge>
  )
}

export default OfferStatus
