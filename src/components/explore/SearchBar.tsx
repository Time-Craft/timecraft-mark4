
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

const SearchBar = () => {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-teal" />
      <Input 
        placeholder="Search offers..." 
        className="pl-10 w-full bg-cream border-mint/20 focus:border-teal focus:ring-teal text-navy placeholder:text-navy/50"
        onChange={(e) => console.log('Search:', e.target.value)}
      />
    </div>
  )
}

export default SearchBar
