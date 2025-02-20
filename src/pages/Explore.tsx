
import { useState } from "react"
import ExploreHeader from "@/components/explore/ExploreHeader"
import ExploreContent from "@/components/explore/ExploreContent"

const Explore = () => {
  const [view, setView] = useState<'list' | 'map'>('list')

  return (
    <div className="container mx-auto p-6">
      <ExploreHeader view={view} onViewChange={setView} />
      <ExploreContent view={view} />
    </div>
  )
}

export default Explore
