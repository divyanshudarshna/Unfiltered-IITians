import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }
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
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedUsers = users.map((u) => {
      // ✅ Calculate actual revenue from paid subscriptions using actualAmountPaid
      const subscriptionRevenue = u.subscriptions.reduce((sum: number, sub) => {
        if (!sub.paid) return sum;
        
        // Use actualAmountPaid if available (new field), otherwise fallback to old method
        if (sub.actualAmountPaid) {
          return sum + (sub.actualAmountPaid / 100); // Convert from paise to rupees
        }
        
        // Fallback for old records (before actualAmountPaid was implemented)
        let itemPrice = 0;
        if (sub.mockTest) {
          itemPrice = sub.mockTest.actualPrice || sub.mockTest.price;
        } else if (sub.course) {
          itemPrice = sub.course.actualPrice || sub.course.price;
        }
        
        return sum + itemPrice;
      }, 0);

      // ✅ Calculate revenue from session enrollments
      const sessionRevenue = u.sessionEnrollments.reduce((sum: number, enrollment) => {
        if (enrollment.paymentStatus !== "SUCCESS") return sum;
        return sum + (enrollment.amountPaid || 0);
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

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        profileImageUrl: u.profileImageUrl,
        phoneNumber: u.phoneNumber,
        fieldOfStudy: u.fieldOfStudy,
        isSubscribed: u.isSubscribed,
        createdAt: u.createdAt.toISOString(),
        joinedAt: u.createdAt.toISOString().split("T")[0],
        subscriptionsCount: u.subscriptions.length,
        enrollmentsCount: u.enrollments.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
        paidSubscriptions
      };
    });

    return NextResponse.json(formattedUsers);
  } catch (error: unknown) {
    console.error("Error in admin GET users:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
