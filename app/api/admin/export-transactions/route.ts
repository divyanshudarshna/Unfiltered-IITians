import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth } from "@/lib/adminAuth"

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    await adminAuth()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const type = searchParams.get("type") // "all", "course", "mock", "bundle", "session"
    const status = searchParams.get("status") // "all", "success", "pending", "failed"
    const format = searchParams.get("format") || "csv" // "csv" or "xlsx"

    // Build date filter
    const dateFilter: Record<string, Date> = {}
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom)
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo + "T23:59:59.999Z")
    }

    let allTransactions: any[] = []

    // Get Subscription Transactions
    if (type === "all" || type === "course" || type === "mock" || type === "bundle" || !type) {
      const subscriptionWhere: Record<string, any> = {}

      // Date filter
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
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } }
          ]
        }
        
        if (subscriptionWhere.OR) {
          subscriptionWhere.AND = [
            { OR: subscriptionWhere.OR },
            {
              OR: [
                { user: userSearchFilter },
                { razorpayOrderId: { contains: search, mode: "insensitive" } },
                { razorpayPaymentId: { contains: search, mode: "insensitive" } },
                { couponCode: { contains: search, mode: "insensitive" } }
              ]
            }
          ]
          delete subscriptionWhere.OR
        } else {
          subscriptionWhere.OR = [
            { user: userSearchFilter },
            { razorpayOrderId: { contains: search, mode: "insensitive" } },
            { razorpayPaymentId: { contains: search, mode: "insensitive" } },
            { couponCode: { contains: search, mode: "insensitive" } }
          ]
        }
      }

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

      allTransactions.push(...subscriptions.map(sub => ({
        id: sub.id,
        type: sub.courseId ? "Course" : sub.mockBundleId ? "Mock Bundle" : "Mock Test",
        itemTitle: sub.course?.title || sub.mockBundle?.title || sub.mockTest?.title || "Unknown",
        userName: sub.user.name || "Unknown",
        userEmail: sub.user.email,
        originalPrice: sub.originalPrice ? (sub.originalPrice / 100).toFixed(2) : (sub.course?.price || sub.mockTest?.price || sub.mockBundle?.basePrice || 0).toFixed(2),
        actualAmountPaid: sub.actualAmountPaid ? (sub.actualAmountPaid / 100).toFixed(2) : (sub.course?.price || sub.mockTest?.price || sub.mockBundle?.discountedPrice || sub.mockBundle?.basePrice || 0).toFixed(2),
        discountApplied: sub.discountApplied ? (sub.discountApplied / 100).toFixed(2) : "0.00",
        couponCode: sub.couponCode || "",
        status: sub.paid ? "Success" : "Pending",
        paymentId: sub.razorpayPaymentId || "",
        orderId: sub.razorpayOrderId || "",
        transactionDate: (sub.paidAt || sub.createdAt).toISOString().split('T')[0],
        transactionTime: (sub.paidAt || sub.createdAt).toISOString().split('T')[1].split('.')[0]
      })))
    }

    // Get Session Transactions
    if (type === "all" || type === "session" || !type) {
      const sessionWhere: Record<string, any> = {}

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
          { studentName: { contains: search, mode: "insensitive" } },
          { studentEmail: { contains: search, mode: "insensitive" } },
          { studentPhone: { contains: search, mode: "insensitive" } },
          { razorpayOrderId: { contains: search, mode: "insensitive" } },
          { razorpayPaymentId: { contains: search, mode: "insensitive" } }
        ]
      }

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
        type: "Guidance Session",
        itemTitle: enrollment.session?.title || "Unknown Session",
        userName: enrollment.user.name || enrollment.studentName || "Unknown",
        userEmail: enrollment.user.email || enrollment.studentEmail,
        originalPrice: (enrollment.session?.price || 0).toFixed(2),
        actualAmountPaid: (enrollment.amountPaid || 0).toFixed(2),
        discountApplied: ((enrollment.session?.price || 0) - (enrollment.amountPaid || 0)).toFixed(2),
        couponCode: "",
        status: enrollment.paymentStatus === "SUCCESS" ? "Success" : enrollment.paymentStatus === "PENDING" ? "Pending" : "Failed",
        paymentId: enrollment.razorpayPaymentId || "",
        orderId: enrollment.razorpayOrderId || "",
        transactionDate: enrollment.enrolledAt.toISOString().split('T')[0],
        transactionTime: enrollment.enrolledAt.toISOString().split('T')[1].split('.')[0]
      })))
    }

    // Sort transactions by date (newest first)
    allTransactions.sort((a, b) => 
      new Date(b.transactionDate + " " + b.transactionTime).getTime() - 
      new Date(a.transactionDate + " " + a.transactionTime).getTime()
    )

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Transaction ID",
        "Type",
        "Item Title", 
        "User Name",
        "User Email",
        "Original Price (₹)",
        "Amount Paid (₹)",
        "Discount Applied (₹)",
        "Coupon Code",
        "Status",
        "Payment ID",
        "Order ID",
        "Transaction Date",
        "Transaction Time"
      ]

      const csvContent = [
        headers.join(","),
        ...allTransactions.map(row => [
          row.id,
          row.type,
          `"${row.itemTitle}"`,
          `"${row.userName}"`,
          row.userEmail,
          row.originalPrice,
          row.actualAmountPaid,
          row.discountApplied,
          row.couponCode,
          row.status,
          row.paymentId,
          row.orderId,
          row.transactionDate,
          row.transactionTime
        ].join(","))
      ].join("\n")

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Return JSON for other formats or if format is not supported
    return NextResponse.json({
      data: allTransactions,
      total: allTransactions.length,
      exportedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error("Error exporting transactions:", error)
    return NextResponse.json(
      { 
        error: "Failed to export transactions", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}