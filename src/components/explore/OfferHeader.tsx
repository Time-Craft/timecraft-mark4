
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Coins } from "lucide-react"

interface OfferHeaderProps {
  user: {
    name: string
    avatar: string
  }
  title: string
  hours: number
  timeCredits?: number // Add optional timeCredits property
}

const OfferHeader = ({ user, title, hours, timeCredits }: OfferHeaderProps) => {
  // Format hours to handle decimal values correctly
  const formattedHours = hours === 1 ? "1h" : 
                         Number.isInteger(hours) ? `${hours}h` : 
                         `${hours.toFixed(1)}h`;

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center space-x-4">
        <Avatar>
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{user.name}</p>
        </div>
      </div>
      <div className="flex flex-col items-end space-y-2">
        <div className="flex items-center text-muted-foreground">
          <Clock className="mr-2 h-4 w-4" />
          <span>Duration: {formattedHours}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Coins className="mr-2 h-4 w-4" />
          <span>Credits: {timeCredits !== undefined ? timeCredits : hours} TC</span>
        </div>
      </div>
    </div>
  )
}

export default OfferHeader
