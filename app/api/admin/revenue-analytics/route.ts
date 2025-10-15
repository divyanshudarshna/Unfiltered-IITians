import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth } from "@/lib/adminAuth"

export async function GET() {
  try {
    // Check admin authentication
    await adminAuth()

    // ✅ Get detailed revenue breakdown by category
    const [
      mockTestRevenue,
      courseRevenue, 
      sessionRevenue,
      mockBundleRevenue
    ] = await Promise.all([
      // Mock Test Revenue
      prisma.subscription.aggregate({
        where: { 
          paid: true,
          mockTestId: { not: null },
          mockBundleId: null // Individual mock purchases only
        },
        _sum: { actualAmountPaid: true },
        _count: { id: true }
      }),

      // Course Revenue  
      prisma.subscription.aggregate({
        where: { 
          paid: true,
          courseId: { not: null }
        },
        _sum: { actualAmountPaid: true },
        _count: { id: true }
      }),

      // Session Revenue
      prisma.sessionEnrollment.aggregate({
        where: { 
          paymentStatus: "SUCCESS",
          amountPaid: { not: null }
        },
        _sum: { amountPaid: true },
        _count: { id: true }
      }),

      // Mock Bundle Revenue
      prisma.subscription.aggregate({
        where: { 
          paid: true,
          mockBundleId: { not: null }
        },
        _sum: { actualAmountPaid: true },
        _count: { id: true }
      })
    ])

    // ✅ Calculate monthly revenue trend (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyRevenue = await prisma.subscription.groupBy({
      by: ['paidAt'],
      where: {
        paid: true,
        paidAt: { gte: sixMonthsAgo },
        actualAmountPaid: { not: null }
      },
      _sum: { actualAmountPaid: true },
      _count: { id: true }
    })

    // ✅ Calculate discount impact
    const discountAnalytics = await prisma.subscription.aggregate({
      where: {
        paid: true,
        discountApplied: { gt: 0 }
      },
      _sum: { 
        discountApplied: true,
        originalPrice: true,
        actualAmountPaid: true 
      },
      _count: { id: true }
    })

    const analytics = {
      // Revenue by category (in rupees)
      revenueByCategory: {
        mockTests: {
          amount: mockTestRevenue._sum.actualAmountPaid ? mockTestRevenue._sum.actualAmountPaid / 100 : 0,
          transactions: mockTestRevenue._count.id
        },
        courses: {
          amount: courseRevenue._sum.actualAmountPaid ? courseRevenue._sum.actualAmountPaid / 100 : 0,
          transactions: courseRevenue._count.id
        },
        sessions: {
          amount: sessionRevenue._sum.amountPaid || 0,
          transactions: sessionRevenue._count.id
        },
        mockBundles: {
          amount: mockBundleRevenue._sum.actualAmountPaid ? mockBundleRevenue._sum.actualAmountPaid / 100 : 0,
          transactions: mockBundleRevenue._count.id
        }
      },

      // Total metrics
      totalRevenue: (
        (mockTestRevenue._sum.actualAmountPaid || 0) +
        (courseRevenue._sum.actualAmountPaid || 0) +
        (mockBundleRevenue._sum.actualAmountPaid || 0)
      ) / 100 + (sessionRevenue._sum.amountPaid || 0),

      totalTransactions: 
        mockTestRevenue._count.id +
        courseRevenue._count.id +
        sessionRevenue._count.id +
        mockBundleRevenue._count.id,

      // Discount impact
      discountImpact: {
        totalDiscountGiven: discountAnalytics._sum.discountApplied ? discountAnalytics._sum.discountApplied / 100 : 0,
        discountedTransactions: discountAnalytics._count.id,
        originalValue: discountAnalytics._sum.originalPrice ? discountAnalytics._sum.originalPrice / 100 : 0,
        actualRevenue: discountAnalytics._sum.actualAmountPaid ? discountAnalytics._sum.actualAmountPaid / 100 : 0
      },

      // Monthly trend (simplified for now)
      monthlyTrend: monthlyRevenue.map(month => ({
        month: month.paidAt,
        revenue: month._sum.actualAmountPaid ? month._sum.actualAmountPaid / 100 : 0,
        transactions: month._count.id
      }))
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error("Error fetching revenue analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch revenue analytics" },
      { status: 500 }
    )
  }
}