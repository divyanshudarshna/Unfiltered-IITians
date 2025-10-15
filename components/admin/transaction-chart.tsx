"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, CalendarDays } from "lucide-react"

interface DailyStatData {
  date: string
  courseRevenue: number
  mockRevenue: number
  bundleRevenue: number
  sessionRevenue: number
  courseCount: number
  mockCount: number
  bundleCount: number
  sessionCount: number
  totalRevenue: number
  totalTransactions: number
}

interface TransactionChartProps {
  data: DailyStatData[]
}

export function TransactionChart({ data }: TransactionChartProps) {
  // Format data for charts
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: item.totalRevenue,
    transactions: item.totalTransactions,
    courses: item.courseRevenue,
    mocks: item.mockRevenue + item.bundleRevenue,
    sessions: item.sessionRevenue
  }))

  return (
    <div className="space-y-4">
      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Daily Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `₹${Number(value).toLocaleString()}`, 
                    name === 'revenue' ? 'Revenue' : 'Transactions'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Revenue by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `₹${Number(value).toLocaleString()}`,
                    name === 'courses' ? 'Courses' : 
                    name === 'mocks' ? 'Mock Tests' : 'Sessions'
                  ]}
                />
                <Bar dataKey="courses" stackId="a" fill="#3b82f6" />
                <Bar dataKey="mocks" stackId="a" fill="#10b981" />
                <Bar dataKey="sessions" stackId="a" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}