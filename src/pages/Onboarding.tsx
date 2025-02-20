
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"

interface OnboardingProps {
  setIsNewUser: (value: boolean) => void;
}

const Onboarding = ({ setIsNewUser }: OnboardingProps) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [username, setUsername] = useState("")
  const [services, setServices] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          services: services.split(',').map(s => s.trim()),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      // Invalidate the profile query to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['profile'] })

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated"
      })
      
      // Set isNewUser to false and redirect to home page
      setIsNewUser(false)
      navigate('/', { replace: true })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 min-h-[calc(100vh-4rem)]">
      <h1 className="text-4xl font-bold text-center mb-8">Welcome to TimeShare</h1>
      
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Complete Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Choose a Username</label>
                <Input 
                  placeholder="username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">What services can you offer?</label>
                <Input 
                  placeholder="e.g., Programming, Teaching, Gardening" 
                  value={services}
                  onChange={(e) => setServices(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Separate multiple services with commas
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Complete Setup"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Onboarding
