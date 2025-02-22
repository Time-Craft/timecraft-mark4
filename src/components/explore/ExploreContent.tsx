
import OfferList from './OfferList'
import MapView from './MapView'

interface ExploreContentProps {
  view: 'list' | 'map'
}

const ExploreContent = ({ view }: ExploreContentProps) => {
  return (
    <div className="w-full min-h-screen pb-24 md:pb-0">
      {view === 'list' ? <OfferList /> : <MapView />}
    </div>
  )
}

export default ExploreContent

