
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle, X } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"

interface OnboardingProps {
  setIsNewUser: (value: boolean) => void;
}

const SERVICE_TYPES = [
  "Programming",
  "Teaching",
  "Gardening",
  "Design",
  "Writing",
  "Marketing",
  "Translation",
  "Consulting",
  "Photography",
  "Music",
  "Cooking",
  "Fitness"
];

const MIN_SERVICES = 3;

const Onboarding = ({ setIsNewUser }: OnboardingProps) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [username, setUsername] = useState("")
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (selectedServices.length < MIN_SERVICES) {
      setError(`Please select at least ${MIN_SERVICES} services`)
    } else {
      setError("")
    }
  }, [selectedServices])

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev => {
      if (prev.includes(service)) {
        return prev.filter(s => s !== service)
      }
      return [...prev, service]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedServices.length < MIN_SERVICES) {
      toast({
        variant: "destructive",
        title: "Invalid selection",
        description: `Please select at least ${MIN_SERVICES} services`
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          services: selectedServices,
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
                <label className="text-sm font-medium">What services interest you?</label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select at least {MIN_SERVICES} services
                </p>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_TYPES.map(service => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => handleServiceToggle(service)}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                        ${selectedServices.includes(service)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                    >
                      {service}
                      {selectedServices.includes(service) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </button>
                  ))}
                </div>
                {error && (
                  <p className="text-sm text-destructive mt-2">{error}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || selectedServices.length < MIN_SERVICES}
              >
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
