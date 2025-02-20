
import { Card } from "@/components/ui/card"
import { Map } from "lucide-react"

const MapView = () => {
  return (
    <Card className="w-full h-full flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <Map className="h-12 w-12 mx-auto mb-2" />
        <p>Map view coming soon</p>
      </div>
    </Card>
  )
}

export default MapView
