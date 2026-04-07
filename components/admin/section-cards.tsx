"use client"

import React, { useEffect, useState } from "react"
import {
  IconTrendingUp,
  IconUsers,
  IconCurrencyDollar,
  IconDeviceGamepad2,
  IconBooks,
  IconChartLine,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type DashboardStats = {
  currentRevenue?: number
  totalRevenue?: number
  lifetimeRevenue?: number
  lastDisbursementDate?: string | null
  lastDisbursementAmount?: number | null
  newCustomersCount: number
  activeAccounts: number
  registeredUsers: number
  totalMocks: number
  totalCourses: number
}

// Helper function to format date as dd/mm/yyyy
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return ""
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function SectionCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/dashboard-stats")
        if (!res.ok) throw new Error("Failed to fetch stats")
        const data = await res.json()
        setStats(data)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <div className="text-center">Loading dashboard stats...</div>
  if (error) return <div>Error loading stats: {error}</div>
  if (!stats) return null

  const currentRevenue = stats.currentRevenue ?? stats.totalRevenue ?? 0
  const lifetimeRevenue = stats.lifetimeRevenue ?? 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Current Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ₹{currentRevenue.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconCurrencyDollar />
              &nbsp; Current
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Revenue since last disbursement <IconTrendingUp className="size-4" />
          </div>
          {lifetimeRevenue > 0 ? (
            <div className="text-muted-foreground">
              ₹{lifetimeRevenue.toLocaleString()} lifetime total
            </div>
          ) : (
            <div className="text-muted-foreground">From paid subscriptions</div>
          )}
          {stats.lastDisbursementDate && (
            <div className="text-xs text-muted-foreground/70">
              Last disbursed: {formatDate(stats.lastDisbursementDate)}
            </div>
          )}
        </CardFooter>
      </Card>


      {/* WILL UNCOMMENT LATER WHEN NEEDED  */}
      {/* <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Customers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.newCustomersCount.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-red-500 border-red-500">
              <IconUserPlus />
              &nbsp; -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Change in new signups <IconTrendingDown  className="size-4" />
          </div>
          <div className="text-muted-foreground">Last 30 days</div>
        </CardFooter>
      </Card> */}

      {/* <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Accounts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.activeAccounts.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconUsers />
              &nbsp; +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong user retention <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Subscribed users</div>
        </CardFooter>
      </Card> */}

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Registered Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.registeredUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconUsers />
              &nbsp; +8%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total registered users <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Since launch</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Mocks Listed</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalMocks.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconDeviceGamepad2 />
              &nbsp; Stable
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total mocks available <IconChartLine className="size-4" />
          </div>
          <div className="text-muted-foreground">User attempts ongoing</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Courses</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalCourses.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconBooks />
              &nbsp; Growing
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Courses offered <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">New courses added regularly</div>
        </CardFooter>
      </Card>
    </div>
  )
}
