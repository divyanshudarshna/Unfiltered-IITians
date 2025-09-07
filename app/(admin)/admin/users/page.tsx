"use client"

import { useEffect, useState } from "react"
import { UsersTable } from "./components/UsersTable"
import { SubscriptionStats } from "./components/SubscriptionStats"
import { MocksStats } from "./components/MocksStats"
import { CourseProgress } from "./components/CourseProgress"
import { RevenueOverview } from "./components/RevenueOverview"
import { Stats } from "./components/Stats"
import { User } from "./types"

type DashboardStats = {
  totalUsers: number
  subscribedUsers: number
  freeUsers: number
  revenue: any
  totalMockAttempts: number
  avgMockScore: number
  avgCourseProgress: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/users/dashboard-data")
        const data = await res.json()
        setUsers(data.users || [])
        setStats(data.stats || null)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <p className="p-6">Loading admin stats...</p>

  return (
    <div className="space-y-8 p-6">
      {/* Top Stats */}
      {stats && <Stats stats={stats} />}

      {/* Users Table */}
      <UsersTable users={users || []} />

      {/* Subscription Insights */}
      <SubscriptionStats users={users || []} />

      {/* Mocks Insights */}
      <MocksStats users={users || []} />

      {/* Course Progress */}
      <CourseProgress users={users || []} />

      {/* Revenue */}
      <RevenueOverview users={users || []} />
    </div>
  )
}

