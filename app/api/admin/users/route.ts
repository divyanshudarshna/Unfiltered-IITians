import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

export async function GET(req: NextRequest) {
  try {
    // Check authentication and authorization (ADMIN-only for user management)
    await assertAdminApiAccess(req.url, req.method);
    const users = await prisma.user.findMany({
      include: {
        subscriptions: {
          select: {
            id: true,
            paid: true,
            actualAmountPaid: true, // ✅ NEW: Use actual amount paid
            originalPrice: true,    // ✅ NEW: For reference
            discountApplied: true,  // ✅ NEW: For analytics
            paidAt: true,          // ✅ NEW: Payment timestamp
            mockTest: {
              select: {
                id: true,
                title: true,
                price: true,
                actualPrice: true,
              }
            },
            course: {
              select: {
                id: true,
                title: true,
                price: true,
                actualPrice: true,
              }
            }
          }
        },
        enrollments: {
          select: {
            id: true,
          }
        },
        sessionEnrollments: { // ✅ NEW: Include session enrollments for revenue
          select: {
            id: true,
            amountPaid: true,
            paymentStatus: true,
            enrolledAt: true,
          }
        },
        mockAttempts: { // ✅ NEW: Include mock attempts for statistics
          select: {
            id: true,
            score: true,
            percentage: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedUsers = users.map((u) => {
      // ✅ Calculate actual revenue from paid subscriptions using actualAmountPaid ONLY
      const subscriptionRevenue = u.subscriptions.reduce((sum: number, sub) => {
        if (!sub.paid || !sub.actualAmountPaid) return sum;
        return sum + (sub.actualAmountPaid / 100); // Convert from paise to rupees
      }, 0);

      // ✅ Calculate revenue from session enrollments using amountPaid
      const sessionRevenue = u.sessionEnrollments.reduce((sum: number, enrollment) => {
        if (enrollment.paymentStatus !== "SUCCESS" || !enrollment.amountPaid) return sum;
        return sum + enrollment.amountPaid; // Already in rupees
      }, 0);

      const totalRevenue = subscriptionRevenue + sessionRevenue;

      // ✅ Get detailed paid subscriptions
      const paidSubscriptions = [
        ...u.subscriptions
          .filter(sub => sub.paid)
          .map(sub => ({
            type: sub.course ? 'course' as const : sub.mockTest ? 'mock' as const : 'bundle' as const,
            title: sub.course?.title || sub.mockTest?.title || 'Bundle',
            amount: sub.actualAmountPaid ? sub.actualAmountPaid / 100 : 
              (sub.course?.price || sub.mockTest?.price || 0),
            paidAt: sub.paidAt?.toISOString() || new Date().toISOString()
          })),
        ...u.sessionEnrollments
          .filter(enrollment => enrollment.paymentStatus === "SUCCESS")
          .map(enrollment => ({
            type: 'session' as const,
            title: 'Guidance Session',
            amount: enrollment.amountPaid || 0,
            paidAt: enrollment.enrolledAt.toISOString()
          }))
      ]

      // ✅ Calculate isPaid status based on actual paid subscriptions or session enrollments
      const hasPaidSubscriptions = u.subscriptions.some(sub => sub.paid);
      const hasSuccessfulSessionEnrollments = u.sessionEnrollments.some(
        enrollment => enrollment.paymentStatus === "SUCCESS"
      );
      const isPaid = hasPaidSubscriptions || hasSuccessfulSessionEnrollments;

      // ✅ Calculate mock attempts statistics
      const mockAttemptsCount = u.mockAttempts.length;
      const avgMockScore = mockAttemptsCount > 0
        ? Math.round(
            (u.mockAttempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / 
            mockAttemptsCount) * 10
          ) / 10
        : 0;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        profileImageUrl: u.profileImageUrl,
        phoneNumber: u.phoneNumber,
        fieldOfStudy: u.fieldOfStudy,
        isSubscribed: u.isSubscribed,
        isPaid, // ✅ NEW: Calculated based on actual payments
        createdAt: u.createdAt.toISOString(),
        joinedAt: u.createdAt.toISOString().split("T")[0],
        subscriptionsCount: u.subscriptions.length,
        enrollmentsCount: u.enrollments.length,
        mockAttemptsCount, // ✅ NEW: Mock attempts count
        avgMockScore, // ✅ NEW: Average mock score
        totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
        paidSubscriptions
      };
    });

    return NextResponse.json(formattedUsers);
  } catch (error: unknown) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Error in admin GET users:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
