
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock } from "lucide-react"

interface OfferHeaderProps {
  user: {
    name: string
    avatar: string
  }
  title: string
  hours: number
}

const OfferHeader = ({ user, title, hours }: OfferHeaderProps) => {
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
      <div className="flex items-center text-muted-foreground">
        <Clock className="mr-2 h-4 w-4" />
        <span>{hours}h</span>
      </div>
    </div>
  )
}

export default OfferHeader
