
import OfferList from './OfferList'
import MapView from './MapView'

interface ExploreContentProps {
  view: 'list' | 'map'
  sortByRelevance?: boolean
}

const ExploreContent = ({ view, sortByRelevance = false }: ExploreContentProps) => {
  return (
    <div className="w-full min-h-screen pb-24 md:pb-0">
      {view === 'list' ? <OfferList sortByRelevance={sortByRelevance} /> : <MapView />}
    </div>
  )
}

export default ExploreContent
