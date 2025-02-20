
import HomeHeader from "@/components/home/HomeHeader"
import QuickStats from "@/components/home/QuickStats"
import PendingOffers from "@/components/home/PendingOffers"
import StatsCards from "@/components/home/StatsCards"

const Home = () => {
  return (
    <div className="container mx-auto p-6">
      <HomeHeader />
      <QuickStats />
      <div className="space-y-6">
        <PendingOffers />
        <StatsCards />
      </div>
    </div>
  )
}

export default Home
