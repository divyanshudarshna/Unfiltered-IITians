// app/api/admin/users/dashboard-data/route.ts
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth"

export async function GET(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, req.method);

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
            mockBundle: true,
          },
        },
        sessionEnrollments: {
          where: {
            paymentStatus: "SUCCESS"
          }
        },
        mockAttempts: true,
        courseProgress: true,
      },
    })

    // ✅ Calculate revenue using EXACT same logic as admin/stats
    const allPaidSubscriptions = users.flatMap(u => u.subscriptions.filter(sub => sub.paid));
    const allSessionEnrollments = users.flatMap(u => u.sessionEnrollments);

    // ✅ Subscription revenue - replicate admin/stats logic exactly
    const subscriptionRevenue = allPaidSubscriptions
      .map(sub => {
        // Calculate actual amount paid - prioritize actualAmountPaid field
        let actualAmount = 0;
        if (sub.actualAmountPaid !== null && sub.actualAmountPaid !== undefined) {
          actualAmount = sub.actualAmountPaid / 100; // Convert paise to rupees
        } else {
          // Only use fallback pricing for old records that don't have actualAmountPaid set
          actualAmount = sub.course?.price || sub.mockTest?.price || sub.mockBundle?.discountedPrice || sub.mockBundle?.basePrice || 0;
        }
        return actualAmount;
      })
      .filter(amount => amount > 0) // ✅ Filter out zero amount transactions - CRITICAL
      .reduce((sum, amount) => sum + amount, 0);

    // ✅ Session revenue - only non-zero amounts
    const sessionRevenue = allSessionEnrollments
      .filter(enrollment => (enrollment.amountPaid || 0) > 0) // ✅ Filter out zero amounts
      .reduce((sum, enrollment) => sum + (enrollment.amountPaid || 0), 0);

    const totalRevenue = subscriptionRevenue + sessionRevenue;

    // Compute other stats
    const totalUsers = users.length
    const totalSubscribers = users.filter(u => u.isSubscribed).length
    
    // ✅ Update enrollments to include ALL types (courses + subscriptions + sessions)
    const totalEnrollments = users.reduce((acc, u) => {
      const courseEnrollments = u.enrollments?.length || 0;
      const paidSubscriptions = u.subscriptions?.filter(sub => sub.paid).length || 0;
      const successfulSessions = u.sessionEnrollments?.filter(se => se.paymentStatus === "SUCCESS").length || 0;
      return acc + courseEnrollments + paidSubscriptions + successfulSessions;
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
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
