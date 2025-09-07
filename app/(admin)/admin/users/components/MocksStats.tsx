"use client"

import { User } from "../types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

type Props = { users: User[] }

export function MocksStats({ users }: Props) {
  // Aggregate number of mocks attempted by users
  const totalMocks = users.reduce((sum, u) => sum + (u.mockAttempts?.length || 0), 0)

  // Build distribution data (0 mocks, 1–3 mocks, 4+ mocks)
  const distribution = [
    {
      name: "0",
      users: users.filter((u) => (u.mockAttempts?.length || 0) === 0).length,
    },
    {
      name: "1-3",
      users: users.filter(
        (u) => (u.mockAttempts?.length || 0) >= 1 && (u.mockAttempts?.length || 0) <= 3
      ).length,
    },
    {
      name: "4+",
      users: users.filter((u) => (u.mockAttempts?.length || 0) > 3).length,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold text-blue-600">
          Mock Test Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4 text-slate-500 dark:text-slate-400">
          Total mock attempts: <span className="font-semibold">{totalMocks}</span>
        </p>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={distribution}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
