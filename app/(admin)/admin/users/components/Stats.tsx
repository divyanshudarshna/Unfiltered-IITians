"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, DollarSign, BookOpen, FileBarChart } from "lucide-react"

type StatsProps = {
  stats: {
    totalUsers: number
    totalSubscribers: number
    totalEnrollments: number
    totalRevenue: number
  }
}

export function Stats({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-600">
            <User className="h-5 w-5" /> Users
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{stats.totalUsers}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-600">
            <BookOpen className="h-5 w-5" /> Subscribers
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{stats.totalSubscribers}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <FileBarChart className="h-5 w-5" /> Enrollments
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{stats.totalEnrollments}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <DollarSign className="h-5 w-5" /> Revenue
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          ₹{stats.totalRevenue.toLocaleString()}
        </CardContent>
      </Card>
    </div>
  )
}
