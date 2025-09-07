"use client"

import { User } from "../types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"

type Props = { users: User[] }

export function RevenueOverview({ users }: Props) {
  // Collect payments from subscriptions
  const transactions: { date: string; amount: number }[] = []

  users.forEach((u) => {
    u.subscriptions?.forEach((s) => {
      if (s.paid) {
        transactions.push({
          date: format(new Date(u.createdAt), "yyyy-MM-dd"),
          amount: 499, // example fixed price per subscription
        })
      }
    })
  })

  // Aggregate by date
  const grouped: Record<string, number> = {}
  transactions.forEach((t) => {
    grouped[t.date] = (grouped[t.date] || 0) + t.amount
  })

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
