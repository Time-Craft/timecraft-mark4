
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff, Mail, LockKeyhole, ArrowRight } from "lucide-react"

const Login = () => {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: "Account created",
        description: "You can now sign in with your credentials.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing up",
        description: error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      {/* Left side - Illustration and Content */}
      <div className="relative flex-1 bg-gradient-to-br from-mint/30 to-teal/20 hidden lg:flex flex-col justify-between p-8">
        <div className="relative z-10 w-full">
          <h1 className="text-4xl font-bold tracking-tight text-navy">
            TimeCraft
          </h1>
          <p className="text-lg text-navy/80 mt-2">Share time, build community</p>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <img 
            src="/lovable-uploads/54f01683-83ae-4364-9af0-157f58a84862.png" 
            alt="Community illustration" 
            className="max-w-md mx-auto rounded-lg shadow-lg object-contain"
          />
        </div>
        
        <div className="relative z-10 bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-mint/20">
          <blockquote className="space-y-2">
            <p className="text-lg text-navy/90 italic">
              "TimeCraft has transformed how our neighborhood connects. We've built a true support network through time exchanges."
            </p>
            <footer className="text-right text-navy/70">
              <p className="font-medium">Sofia & Miguel</p>
              <p className="text-sm">Community Leaders</p>
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-cream">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-navy">Welcome</h2>
            <p className="text-muted-foreground">
              Sign in to your account or create a new one
            </p>
          </div>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-cream">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">
                Sign in to TimeCraft
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label 
                    htmlFor="email"
                    className="text-sm font-medium text-navy"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="email"
                      placeholder="name@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="pl-10 border-mint/30 focus-visible:ring-teal"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label 
                    htmlFor="password"
                    className="text-sm font-medium text-navy"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      autoCapitalize="none"
                      autoComplete="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="pl-10 border-mint/30 focus-visible:ring-teal"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button 
                  onClick={handleSignIn} 
                  disabled={isSubmitting || !email || !password}
                  className="w-full bg-teal hover:bg-teal/90 text-white font-medium py-2 flex items-center justify-center group"
                >
                  {isSubmitting ? "Signing in..." : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-mint/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-cream px-4 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleSignUp}
                  disabled={isSubmitting || !email || !password}
                  className="w-full border-mint/30 hover:bg-mint/10 hover:text-navy"
                >
                  {isSubmitting ? "Creating account..." : "Create Account"}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center text-sm text-muted-foreground mt-6">
            <p>
              TimeCraft - Building stronger communities through time exchanges.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
