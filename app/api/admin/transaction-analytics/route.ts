import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth } from "@/lib/adminAuth"

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    await adminAuth()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const search = searchParams.get("search") || ""
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const type = searchParams.get("type") // "all", "course", "mock", "bundle", "session"
    const status = searchParams.get("status") // "all", "success", "pending", "failed"

    const skip = (page - 1) * limit

    // Build date filter
    const dateFilter: any = {}
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom)
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo + "T23:59:59.999Z") // Include end of day
    }

    let allTransactions: any[] = []

    // ✅ Get Subscription Transactions
    if (type === "all" || type === "course" || type === "mock" || type === "bundle" || !type) {
      const subscriptionWhere: any = {}

      // Date filter - use OR for paidAt and createdAt
      if (Object.keys(dateFilter).length > 0) {
        subscriptionWhere.OR = [
          { paidAt: dateFilter },
          { 
            AND: [
              { paidAt: null },
              { createdAt: dateFilter }
            ]
          }
        ]
      }

      // Apply type filter for subscriptions
      if (type && type !== "all") {
        if (type === "course") {
          subscriptionWhere.courseId = { not: null }
          subscriptionWhere.mockTestId = null
          subscriptionWhere.mockBundleId = null
        } else if (type === "mock") {
          subscriptionWhere.mockTestId = { not: null }
          subscriptionWhere.mockBundleId = null
        } else if (type === "bundle") {
          subscriptionWhere.mockBundleId = { not: null }
        }
      }

      // Apply status filter
      if (status && status !== "all") {
        if (status === "success") {
          subscriptionWhere.paid = true
        } else if (status === "pending") {
          subscriptionWhere.paid = false
        }
      }

      // Add search filter for subscriptions
      if (search) {
        const userSearchFilter = {
          OR: [
            { name: { contains: search, mode: "insensitive" as any } },
            { email: { contains: search, mode: "insensitive" as any } }
          ]
        }
        
        if (subscriptionWhere.OR) {
          subscriptionWhere.AND = [
            { OR: subscriptionWhere.OR },
            {
              OR: [
                { user: userSearchFilter },
                { razorpayOrderId: { contains: search, mode: "insensitive" as any } },
                { razorpayPaymentId: { contains: search, mode: "insensitive" as any } },
                { couponCode: { contains: search, mode: "insensitive" as any } }
              ]
            }
          ]
          delete subscriptionWhere.OR
        } else {
          subscriptionWhere.OR = [
            { user: userSearchFilter },
            { razorpayOrderId: { contains: search, mode: "insensitive" as any } },
            { razorpayPaymentId: { contains: search, mode: "insensitive" as any } },
            { couponCode: { contains: search, mode: "insensitive" as any } }
          ]
        }
      }

      try {
        const subscriptions = await prisma.subscription.findMany({
          where: subscriptionWhere,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImageUrl: true
              }
            },
            mockTest: {
              select: {
                id: true,
                title: true,
                price: true
              }
            },
            course: {
              select: {
                id: true,
                title: true,
                price: true
              }
            },
            mockBundle: {
              select: {
                id: true,
                title: true,
                basePrice: true,
                discountedPrice: true
              }
            }
          },
          orderBy: [
            { paidAt: "desc" },
            { createdAt: "desc" }
          ]
        })

        allTransactions.push(...subscriptions
          .map(sub => {
            // Calculate actual amount paid - prioritize actualAmountPaid field
            let actualAmount = 0;
            if (sub.actualAmountPaid !== null && sub.actualAmountPaid !== undefined) {
              actualAmount = sub.actualAmountPaid / 100; // Convert paise to rupees
            } else {
              // Only use fallback pricing for old records that don't have actualAmountPaid set
              actualAmount = sub.course?.price || sub.mockTest?.price || sub.mockBundle?.discountedPrice || sub.mockBundle?.basePrice || 0;
            }

            return {
              id: sub.id,
              type: sub.courseId ? "course" : sub.mockBundleId ? "bundle" : "mock",
              itemId: sub.courseId || sub.mockBundleId || sub.mockTestId,
              itemTitle: sub.course?.title || sub.mockBundle?.title || sub.mockTest?.title || "Unknown",
              user: sub.user,
              originalPrice: sub.originalPrice ? sub.originalPrice / 100 : (sub.course?.price || sub.mockTest?.price || sub.mockBundle?.basePrice || 0),
              actualAmountPaid: actualAmount,
              discountApplied: sub.discountApplied ? sub.discountApplied / 100 : 0,
              couponCode: sub.couponCode,
              status: sub.paid ? "success" : "pending",
              paymentId: sub.razorpayPaymentId,
              orderId: sub.razorpayOrderId,
              transactionDate: sub.paidAt || sub.createdAt,
              createdAt: sub.createdAt
            };
          })
          .filter(transaction => transaction.actualAmountPaid > 0) // ✅ Filter out zero amount transactions
        )
      } catch (error) {
        console.error("Error fetching subscriptions:", error)
      }
    }

    // ✅ Get Session Transactions
    if (type === "all" || type === "session" || !type) {
      const sessionWhere: any = {}

      // Date filter
      if (Object.keys(dateFilter).length > 0) {
        sessionWhere.enrolledAt = dateFilter
      }

      // Apply status filter for sessions
      if (status && status !== "all") {
        if (status === "success") {
          sessionWhere.paymentStatus = "SUCCESS"
        } else if (status === "pending") {
          sessionWhere.paymentStatus = "PENDING"
        } else if (status === "failed") {
          sessionWhere.paymentStatus = "FAILED"
        }
      }

      // Add search filter for sessions
      if (search) {
        sessionWhere.OR = [
          { studentName: { contains: search, mode: "insensitive" as any } },
          { studentEmail: { contains: search, mode: "insensitive" as any } },
          { studentPhone: { contains: search, mode: "insensitive" as any } },
          { razorpayOrderId: { contains: search, mode: "insensitive" as any } },
          { razorpayPaymentId: { contains: search, mode: "insensitive" as any } }
        ]
      }

      try {
        const sessionEnrollments = await prisma.sessionEnrollment.findMany({
          where: sessionWhere,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImageUrl: true
              }
            },
            session: {
              select: {
                id: true,
                title: true,
                price: true,
                discountedPrice: true
              }
            }
          },
          orderBy: { enrolledAt: "desc" }
        })

        allTransactions.push(...sessionEnrollments.map(enrollment => ({
          id: enrollment.id,
          type: "session",
          itemId: enrollment.sessionId,
          itemTitle: enrollment.session?.title || "Unknown Session",
          user: enrollment.user,
          originalPrice: enrollment.session?.price || 0,
          actualAmountPaid: enrollment.amountPaid || 0,
          discountApplied: (enrollment.session?.price || 0) - (enrollment.amountPaid || 0),
          couponCode: null,
          status: enrollment.paymentStatus?.toLowerCase() || "pending",
          paymentId: enrollment.razorpayPaymentId,
          orderId: enrollment.razorpayOrderId,
          transactionDate: enrollment.enrolledAt,
          createdAt: enrollment.enrolledAt
        })))
      } catch (error) {
        console.error("Error fetching session enrollments:", error)
      }
    }

    // Sort combined transactions
    allTransactions.sort((a, b) => 
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    )

    // Apply pagination to combined results
    const paginatedTransactions = allTransactions.slice(skip, skip + limit)

    return NextResponse.json({
      transactions: paginatedTransactions,
      pagination: {
        page,
        limit,
        total: allTransactions.length,
        pages: Math.ceil(allTransactions.length / limit)
      },
      summary: {
        totalTransactions: allTransactions.length,
        totalRevenue: allTransactions
          .filter(t => t.status === "success")
          .reduce((sum, t) => sum + (t.actualAmountPaid || 0), 0),
        totalDiscounts: allTransactions
          .filter(t => t.status === "success")
          .reduce((sum, t) => sum + (t.discountApplied || 0), 0)
      }
    })

  } catch (error) {
    console.error("Error fetching transaction analytics:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch transaction analytics", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}