import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth } from "@/lib/adminAuth"

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    await adminAuth()

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    // Build date filter
    const dateFilter: Record<string, any> = {}
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom)
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo + "T23:59:59.999Z")
    }

    // Get successful subscription transactions
    const successfulSubscriptions = await prisma.subscription.findMany({
      where: {
        paid: true,
        ...(Object.keys(dateFilter).length > 0 && {
          OR: [
            { paidAt: dateFilter },
            { 
              AND: [
                { paidAt: null },
                { createdAt: dateFilter }
              ]
            }
          ]
        })
      },
      include: {
        course: { select: { title: true, price: true } },
        mockTest: { select: { title: true, price: true } },
        mockBundle: { select: { title: true, basePrice: true, discountedPrice: true } }
      }
    })

    // Get successful session transactions
    const successfulSessions = await prisma.sessionEnrollment.findMany({
      where: {
        paymentStatus: "SUCCESS",
        ...(Object.keys(dateFilter).length > 0 && { enrolledAt: dateFilter })
      },
      include: {
        session: { select: { title: true, price: true } }
      }
    })

    // Calculate revenue by category
    let courseRevenue = 0
    let mockRevenue = 0
    let bundleRevenue = 0
    let sessionRevenue = 0
    let totalDiscounts = 0

    // Process subscriptions
    successfulSubscriptions.forEach(sub => {
      const actualAmount = sub.actualAmountPaid ? sub.actualAmountPaid / 100 : 0
      const discount = sub.discountApplied ? sub.discountApplied / 100 : 0
      
      if (sub.courseId) {
        courseRevenue += actualAmount
      } else if (sub.mockBundleId) {
        bundleRevenue += actualAmount
      } else if (sub.mockTestId) {
        mockRevenue += actualAmount
      }
      
      totalDiscounts += discount
    })

    // Process sessions
    successfulSessions.forEach(session => {
      sessionRevenue += session.amountPaid || 0
    })

    const totalRevenue = courseRevenue + mockRevenue + bundleRevenue + sessionRevenue
    const totalTransactions = successfulSubscriptions.length + successfulSessions.length

    // Get counts for each category
    const courseCounts = successfulSubscriptions.filter(s => s.courseId).length
    const mockCounts = successfulSubscriptions.filter(s => s.mockTestId).length
    const bundleCounts = successfulSubscriptions.filter(s => s.mockBundleId).length
    const sessionCounts = successfulSessions.length

    // Get pending transactions
    const pendingSubscriptions = await prisma.subscription.count({
      where: {
        paid: false,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      }
    })

    const pendingSessions = await prisma.sessionEnrollment.count({
      where: {
        paymentStatus: "PENDING",
        ...(Object.keys(dateFilter).length > 0 && { enrolledAt: dateFilter })
      }
    })

    // Calculate average transaction value
    const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalTransactions,
      totalDiscounts: Math.round(totalDiscounts * 100) / 100,
      avgTransactionValue: Math.round(avgTransactionValue * 100) / 100,
      pendingTransactions: pendingSubscriptions + pendingSessions,
      
      // Revenue by category
      categoryBreakdown: {
        courses: {
          revenue: Math.round(courseRevenue * 100) / 100,
          count: courseCounts,
          percentage: totalRevenue > 0 ? Math.round((courseRevenue / totalRevenue) * 100) : 0
        },
        mockTests: {
          revenue: Math.round(mockRevenue * 100) / 100,
          count: mockCounts,
          percentage: totalRevenue > 0 ? Math.round((mockRevenue / totalRevenue) * 100) : 0
        },
        mockBundles: {
          revenue: Math.round(bundleRevenue * 100) / 100,
          count: bundleCounts,
          percentage: totalRevenue > 0 ? Math.round((bundleRevenue / totalRevenue) * 100) : 0
        },
        sessions: {
          revenue: Math.round(sessionRevenue * 100) / 100,
          count: sessionCounts,
          percentage: totalRevenue > 0 ? Math.round((sessionRevenue / totalRevenue) * 100) : 0
        }
      },

      // Growth metrics (compared to previous period if date range provided)
      ...(dateFrom && dateTo && await getGrowthMetrics(dateFrom, dateTo))
    })

  } catch (error) {
    console.error("Error fetching transaction stats:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch transaction stats", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}

async function getGrowthMetrics(dateFrom: string, dateTo: string) {
  try {
    const fromDate = new Date(dateFrom)
    const toDate = new Date(dateTo)
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Calculate previous period
    const prevFromDate = new Date(fromDate.getTime() - (daysDiff * 24 * 60 * 60 * 1000))
    const prevToDate = new Date(fromDate.getTime() - 1)

    const prevDateFilter = {
      gte: prevFromDate,
      lte: prevToDate
    }

    // Get previous period data
    const prevSubscriptions = await prisma.subscription.findMany({
      where: {
        paid: true,
        OR: [
          { paidAt: prevDateFilter },
          { 
            AND: [
              { paidAt: null },
              { createdAt: prevDateFilter }
            ]
          }
        ]
      }
    })

    const prevSessions = await prisma.sessionEnrollment.findMany({
      where: {
        paymentStatus: "SUCCESS",
        enrolledAt: prevDateFilter
      }
    })

    const prevRevenue = [
      ...prevSubscriptions.map(s => s.actualAmountPaid ? s.actualAmountPaid / 100 : 0),
      ...prevSessions.map(s => s.amountPaid || 0)
    ].reduce((sum, amount) => sum + amount, 0)

    const prevTransactionCount = prevSubscriptions.length + prevSessions.length

    return {
      growth: {
        revenueGrowth: prevRevenue > 0 ? Math.round(((0 - prevRevenue) / prevRevenue) * 100) : 0,
        transactionGrowth: prevTransactionCount > 0 ? Math.round(((0 - prevTransactionCount) / prevTransactionCount) * 100) : 0
      }
    }
  } catch (error) {
    console.error("Error calculating growth metrics:", error)
    return {}
  }
}