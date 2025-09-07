// app/api/admin/users/dashboard-data/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma" // make sure your Prisma client is exported from this path

export async function GET() {
  try {
    // Fetch users with relations
    const users = await prisma.user.findMany({
      include: {
        enrollments: {
          include: {
            course: true,
          },
        },
        subscriptions: {
          include: {
            course: true,
            mockTest: true,
          },
        },
        mockAttempts: true,
        courseProgress: true,
      },
    })

    // Compute stats
    const totalUsers = users.length
    const totalSubscribers = users.filter(u => u.isSubscribed).length
    const totalEnrollments = users.reduce((acc, u) => acc + (u.enrollments?.length || 0), 0)
    const totalRevenue = users.reduce((acc, u) => {
      const courseRevenue = u.subscriptions?.reduce(
        (sum, sub) => sum + (sub.paid ? (sub.course?.price || 0) + (sub.mockTest?.price || 0) : 0),
        0
      ) || 0
      return acc + courseRevenue
    }, 0)

    return NextResponse.json({
      users,
      stats: {
        totalUsers,
        totalSubscribers,
        totalEnrollments,
        totalRevenue,
      },
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
