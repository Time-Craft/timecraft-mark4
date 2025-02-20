
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Award } from "lucide-react"

const Challenges = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Challenges</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">First Exchange</CardTitle>
            <Trophy className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Complete your first time exchange</p>
            <div className="mt-4">
              <Button variant="outline" className="w-full">Start</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Helpful Member</CardTitle>
            <Award className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Help 5 different community members</p>
            <div className="mt-4">
              <Button variant="outline" className="w-full">0/5 Completed</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Challenges
