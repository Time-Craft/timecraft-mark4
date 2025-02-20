
import { useState } from 'react'
import OfferList from './OfferList'
import MapView from './MapView'

interface ExploreContentProps {
  view: 'list' | 'map'
}

const ExploreContent = ({ view }: ExploreContentProps) => {
  return (
    <div className="w-full h-[calc(100vh-12rem)]">
      {view === 'list' ? <OfferList /> : <MapView />}
    </div>
  )
}

export default ExploreContent
