import { Link, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Home, Search, Plus, User, Trophy, LogOut } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"

const MainNav = () => {
  const location = useLocation()
  const { toast } = useToast()
  const isActive = (path: string) => location.pathname === path

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message
      })
    }
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="border-b border-mint/20 hidden md:block bg-cream/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-navy hover:text-teal transition-colors">TimeCraft</Link>
            
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" className={`flex items-center gap-2 ${
                  isActive('/') ? 'text-teal bg-mint/10' : 'text-navy hover:text-teal hover:bg-mint/10'
                }`}>
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant="ghost" className={`flex items-center gap-2 ${
                  isActive('/explore') ? 'text-teal bg-mint/10' : 'text-navy hover:text-teal hover:bg-mint/10'
                }`}>
                  <Search className="h-4 w-4" />
                  Explore
                </Button>
              </Link>
              <Link to="/offer">
                <Button variant="ghost" className={`flex items-center gap-2 ${
                  isActive('/offer') ? 'text-teal bg-mint/10' : 'text-navy hover:text-teal hover:bg-mint/10'
                }`}>
                  <Plus className="h-4 w-4" />
                  New Offer
                </Button>
              </Link>
              <Link to="/challenges">
                <Button variant="ghost" className={`flex items-center gap-2 ${
                  isActive('/challenges') ? 'text-teal bg-mint/10' : 'text-navy hover:text-teal hover:bg-mint/10'
                }`}>
                  <Trophy className="h-4 w-4" />
                  Goals
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" className={`flex items-center gap-2 ${
                  isActive('/profile') ? 'text-teal bg-mint/10' : 'text-navy hover:text-teal hover:bg-mint/10'
                }`}>
                  <User className="h-4 w-4" />
                  Profile
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-cream/95 backdrop-blur-sm border-t border-mint/20 md:hidden z-50">
        <div className="flex justify-around items-center p-2">
          <Link to="/" className="flex-1">
            <Button 
              variant={isActive('/') ? 'default' : 'ghost'} 
              className={`w-full flex flex-col items-center gap-1 h-auto py-2 ${
                isActive('/') ? 'text-cream bg-teal hover:bg-teal/90' : 'text-navy hover:text-teal hover:bg-mint/10'
              }`}
              size="sm"
            >
              <Home className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </Button>
          </Link>
          <Link to="/explore" className="flex-1">
            <Button 
              variant={isActive('/explore') ? 'default' : 'ghost'} 
              className={`w-full flex flex-col items-center gap-1 h-auto py-2 ${
                isActive('/explore') ? 'text-cream bg-teal hover:bg-teal/90' : 'text-navy hover:text-teal hover:bg-mint/10'
              }`}
              size="sm"
            >
              <Search className="h-5 w-5" />
              <span className="text-xs">Explore</span>
            </Button>
          </Link>
          <Link to="/offer" className="flex-1">
            <Button 
              variant={isActive('/offer') ? 'default' : 'ghost'} 
              className={`w-full flex flex-col items-center gap-1 h-auto py-2 ${
                isActive('/offer') ? 'text-cream bg-teal hover:bg-teal/90' : 'text-navy hover:text-teal hover:bg-mint/10'
              }`}
              size="sm"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">New</span>
            </Button>
          </Link>
          <Link to="/challenges" className="flex-1">
            <Button 
              variant={isActive('/challenges') ? 'default' : 'ghost'} 
              className={`w-full flex flex-col items-center gap-1 h-auto py-2 ${
                isActive('/challenges') ? 'text-cream bg-teal hover:bg-teal/90' : 'text-navy hover:text-teal hover:bg-mint/10'
              }`}
              size="sm"
            >
              <Trophy className="h-5 w-5" />
              <span className="text-xs">Goals</span>
            </Button>
          </Link>
          <Link to="/profile" className="flex-1">
            <Button 
              variant={isActive('/profile') ? 'default' : 'ghost'} 
              className={`w-full flex flex-col items-center gap-1 h-auto py-2 ${
                isActive('/profile') ? 'text-cream bg-teal hover:bg-teal/90' : 'text-navy hover:text-teal hover:bg-mint/10'
              }`}
              size="sm"
            >
              <User className="h-5 w-5" />
              <span className="text-xs">Profile</span>
            </Button>
          </Link>
        </div>
      </nav>

      {/* Add padding to main content to account for fixed bottom nav on mobile */}
      <div className="pb-16 md:pb-0">
        
      </div>
    </>
  )
}

export default MainNav
