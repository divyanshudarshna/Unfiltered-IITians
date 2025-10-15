import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth } from "@/lib/adminAuth"

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    await adminAuth()

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30")

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get all successful transactions in the date range
    const [subscriptions, sessions] = await Promise.all([
      prisma.subscription.findMany({
        where: {
          paid: true,
          OR: [
            {
              paidAt: {
                gte: startDate,
                lte: endDate
              }
            },
            {
              AND: [
                { paidAt: null },
                {
                  createdAt: {
                    gte: startDate,
                    lte: endDate
                  }
                }
              ]
            }
          ]
        },
        include: {
          course: { select: { price: true } },
          mockTest: { select: { price: true } },
          mockBundle: { select: { basePrice: true, discountedPrice: true } }
        }
      }),
      prisma.sessionEnrollment.findMany({
        where: {
          paymentStatus: "SUCCESS",
          enrolledAt: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ])

    // Group by date
    const dailyStatsMap = new Map()

    // Process subscriptions
    subscriptions.forEach(sub => {
      const date = (sub.paidAt || sub.createdAt).toISOString().split('T')[0]
      if (!dailyStatsMap.has(date)) {
        dailyStatsMap.set(date, {
          date,
          courseRevenue: 0,
          mockRevenue: 0,
          bundleRevenue: 0,
          sessionRevenue: 0,
          courseCount: 0,
          mockCount: 0,
          bundleCount: 0,
          sessionCount: 0,
          totalRevenue: 0,
          totalTransactions: 0
        })
      }

      const dayStats = dailyStatsMap.get(date)
      const revenue = sub.actualAmountPaid ? sub.actualAmountPaid / 100 : 
        (sub.course?.price || sub.mockTest?.price || sub.mockBundle?.discountedPrice || sub.mockBundle?.basePrice || 0)

      if (sub.courseId) {
        dayStats.courseRevenue += revenue
        dayStats.courseCount += 1
      } else if (sub.mockBundleId) {
        dayStats.bundleRevenue += revenue
        dayStats.bundleCount += 1
      } else if (sub.mockTestId) {
        dayStats.mockRevenue += revenue
        dayStats.mockCount += 1
      }

      dayStats.totalRevenue += revenue
      dayStats.totalTransactions += 1
    })

    // Process sessions
    sessions.forEach(session => {
      const date = session.enrolledAt.toISOString().split('T')[0]
      if (!dailyStatsMap.has(date)) {
        dailyStatsMap.set(date, {
          date,
          courseRevenue: 0,
          mockRevenue: 0,
          bundleRevenue: 0,
          sessionRevenue: 0,
          courseCount: 0,
          mockCount: 0,
          bundleCount: 0,
          sessionCount: 0,
          totalRevenue: 0,
          totalTransactions: 0
        })
      }

      const dayStats = dailyStatsMap.get(date)
      const revenue = session.amountPaid || 0

      dayStats.sessionRevenue += revenue
      dayStats.sessionCount += 1
      dayStats.totalRevenue += revenue
      dayStats.totalTransactions += 1
    })

    // Convert to array and sort
    const dailyStats = Array.from(dailyStatsMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Calculate summary
    const totalRevenue = dailyStats.reduce((sum, day) => sum + day.totalRevenue, 0)
    const totalTransactions = dailyStats.reduce((sum, day) => sum + day.totalTransactions, 0)

    // Category breakdown
    const categoryBreakdown = {
      courses: {
        revenue: dailyStats.reduce((sum, day) => sum + day.courseRevenue, 0),
        transactions: dailyStats.reduce((sum, day) => sum + day.courseCount, 0),
        topItems: []
      },
      mocks: {
        revenue: dailyStats.reduce((sum, day) => sum + day.mockRevenue, 0),
        transactions: dailyStats.reduce((sum, day) => sum + day.mockCount, 0),
        topItems: []
      },
      bundles: {
        revenue: dailyStats.reduce((sum, day) => sum + day.bundleRevenue, 0),
        transactions: dailyStats.reduce((sum, day) => sum + day.bundleCount, 0),
        topItems: []
      },
      sessions: {
        revenue: dailyStats.reduce((sum, day) => sum + day.sessionRevenue, 0),
        transactions: dailyStats.reduce((sum, day) => sum + day.sessionCount, 0),
        topItems: []
      }
    }

    return NextResponse.json({
      dailyStats,
      summary: {
        totalDays: days,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTransactions,
        avgDailyRevenue: Math.round((totalRevenue / days) * 100) / 100,
        avgDailyTransactions: Math.round((totalTransactions / days) * 10) / 10
      },
      categoryBreakdown
    })

  } catch (error) {
    console.error("Error fetching daily stats:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch daily stats", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}