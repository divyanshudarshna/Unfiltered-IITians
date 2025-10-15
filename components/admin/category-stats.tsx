"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Target, Package, Users, TrendingUp } from "lucide-react"

interface CategoryBreakdown {
  courses: { revenue: number; transactions: number; topItems: TopItem[] }
  mocks: { revenue: number; transactions: number; topItems: TopItem[] }
  bundles: { revenue: number; transactions: number; topItems: TopItem[] }
  sessions: { revenue: number; transactions: number; topItems: TopItem[] }
}

interface TopItem {
  id: string
  title: string
  revenue: number
  transactions: number
  price: number
  discountedPrice?: number
}

interface CategoryStatsProps {
  data: CategoryBreakdown
}

export function CategoryStats({ data }: CategoryStatsProps) {
  const totalRevenue = data.courses.revenue + data.mocks.revenue + data.bundles.revenue + data.sessions.revenue

  const categories = [
    {
      name: "Courses",
      icon: BookOpen,
      data: data.courses,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700"
    },
    {
      name: "Mock Tests",
      icon: Target,
      data: data.mocks,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-700"
    },
    {
      name: "Mock Bundles",
      icon: Package,
      data: data.bundles,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    },
    {
      name: "Sessions",
      icon: Users,
      data: data.sessions,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Category Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map((category) => {
          const percentage = totalRevenue > 0 ? (category.data.revenue / totalRevenue) * 100 : 0
          const Icon = category.icon

          return (
            <div key={category.name} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${category.bgColor}`}>
                    <Icon className={`h-4 w-4 ${category.textColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.data.transactions} transactions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₹{category.data.revenue.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                </div>
              </div>
              
              <Progress value={percentage} className="h-2" />
              
              {/* Top Items */}
              {category.data.topItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Top Performers
                  </h4>
                  <div className="space-y-2">
                    {category.data.topItems.slice(0, 3).map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                            {index + 1}
                          </Badge>
                          <span className="truncate max-w-[200px]">{item.title}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{item.revenue.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.transactions} sales
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}