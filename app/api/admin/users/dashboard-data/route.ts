// app/api/admin/users/dashboard-data/route.ts
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth"

export async function GET(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    // Get revenue settings for date filtering
    const revenueSettings = await prisma.revenueSettings.findFirst();
    const lastDisbursementDate = revenueSettings?.lastDisbursementDate || null;

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

    // ✅ Calculate CURRENT revenue (from last disbursement) using EXACT same logic as admin/stats
    const currentPaidSubscriptions = users.flatMap(u => 
      u.subscriptions.filter(sub => {
        if (!sub.paid) return false;
        if (lastDisbursementDate) {
          return Boolean(sub.paidAt) && new Date(sub.paidAt as Date) >= new Date(lastDisbursementDate);
        }
        return true;
      })
    );
    
    const currentSessionEnrollments = users.flatMap(u => 
      u.sessionEnrollments.filter(enrollment => {
        if (lastDisbursementDate && enrollment.enrolledAt) {
          return new Date(enrollment.enrolledAt) >= new Date(lastDisbursementDate);
        }
        return true;
      })
    );

    // ✅ Current Subscription revenue
    const currentSubscriptionRevenue = currentPaidSubscriptions
      .map(sub => {
        let actualAmount = 0;
        if (sub.actualAmountPaid !== null && sub.actualAmountPaid !== undefined) {
          actualAmount = sub.actualAmountPaid / 100;
        } else {
          actualAmount = sub.course?.price || sub.mockTest?.price || sub.mockBundle?.discountedPrice || sub.mockBundle?.basePrice || 0;
        }
        return actualAmount;
      })
      .filter(amount => amount > 0)
      .reduce((sum, amount) => sum + amount, 0);

    const currentSessionRevenue = currentSessionEnrollments
      .filter(enrollment => (enrollment.amountPaid || 0) > 0)
      .reduce((sum, enrollment) => sum + (enrollment.amountPaid || 0), 0);

    const currentRevenue = currentSubscriptionRevenue + currentSessionRevenue;

    // ✅ Calculate LIFETIME revenue (all time)
    const allPaidSubscriptions = users.flatMap(u => u.subscriptions.filter(sub => sub.paid));
    const allSessionEnrollments = users.flatMap(u => u.sessionEnrollments);

    const lifetimeSubscriptionRevenue = allPaidSubscriptions
      .map(sub => {
        let actualAmount = 0;
        if (sub.actualAmountPaid !== null && sub.actualAmountPaid !== undefined) {
          actualAmount = sub.actualAmountPaid / 100;
        } else {
          actualAmount = sub.course?.price || sub.mockTest?.price || sub.mockBundle?.discountedPrice || sub.mockBundle?.basePrice || 0;
        }
        return actualAmount;
      })
      .filter(amount => amount > 0)
      .reduce((sum, amount) => sum + amount, 0);

    const lifetimeSessionRevenue = allSessionEnrollments
      .filter(enrollment => (enrollment.amountPaid || 0) > 0)
      .reduce((sum, enrollment) => sum + (enrollment.amountPaid || 0), 0);

    const lifetimeRevenue = lifetimeSubscriptionRevenue + lifetimeSessionRevenue;

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
        totalRevenue: currentRevenue,
        lifetimeRevenue,
        lastDisbursementDate,
        lastDisbursementAmount: revenueSettings?.lastDisbursementAmount || null,
      },
    })
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
