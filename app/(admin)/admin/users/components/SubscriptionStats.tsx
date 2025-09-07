"use client"

import { User as UserType } from "../types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

type Props = { users: UserType[] }

export function SubscriptionStats({ users }: Props) {
  const active = users.filter((u) => u.isSubscribed).length
  const free = users.length - active

  const data = [
    { name: "Subscribed", value: active },
    { name: "Free Users", value: free },
  ]

  const COLORS = ["#06b6d4", "#9333ea"] // cyan & purple

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold text-purple-600">
          Subscription Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
