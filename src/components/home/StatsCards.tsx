
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const StatsCards = () => {
  const stats = [
    {
      title: "Total Exchanges",
      value: "24",
      description: "Time exchanges completed"
    },
    {
      title: "Average Rating",
      value: "4.8",
      description: "Out of 5 stars"
    },
    {
      title: "Most Offered",
      value: "Programming",
      description: "Your top service"
    },
    {
      title: "Community Rank",
      value: "#12",
      description: "Among active users"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title} className="gradient-border card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-navy">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">{stat.value}</div>
            <p className="text-xs text-teal mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default StatsCards
