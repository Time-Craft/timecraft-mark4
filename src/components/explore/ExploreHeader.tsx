
import { Button } from "@/components/ui/button"
import { Map, List } from "lucide-react"
import SearchBar from "./SearchBar"

interface ExploreHeaderProps {
  view: 'list' | 'map'
  onViewChange: (view: 'list' | 'map') => void
}

const ExploreHeader = ({ view, onViewChange }: ExploreHeaderProps) => {
  return (
    <div className="flex flex-col space-y-4 mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-navy">Explore Time Offers</h1>
      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1">
          <SearchBar />
        </div>
        <div className="flex space-x-2 self-end">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onViewChange('list')}
            className="bg-teal text-cream hover:bg-teal/90"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'map' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onViewChange('map')}
            className="bg-teal text-cream hover:bg-teal/90"
          >
            <Map className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ExploreHeader
