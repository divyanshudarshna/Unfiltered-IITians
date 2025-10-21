"use client"

import { User } from "../types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"

type Props = { readonly users: User[] }

export function RevenueOverview({ users }: Props) {
  // Collect payments by user registration date (simplified approach)
  const transactions: { date: string; amount: number }[] = []

  for (const user of users) {
    // Use user's total revenue (calculated on backend) and their join date
    if (user.totalRevenue && user.totalRevenue > 0) {
      transactions.push({
        date: format(new Date(user.createdAt), "yyyy-MM-dd"),
        amount: user.totalRevenue,
      })
    }
  }

  // Aggregate by date
  const grouped: Record<string, number> = {}
  for (const transaction of transactions) {
    grouped[transaction.date] = (grouped[transaction.date] || 0) + transaction.amount
  }

  const data = Object.keys(grouped).map((date) => ({
    date,
    revenue: grouped[date],
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold text-cyan-600">
          Revenue Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={data}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
