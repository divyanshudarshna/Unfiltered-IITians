// app/api/billing/history/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find user in database
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
      select: { id: true }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch all subscriptions (courses, mocks, bundles)
    const subscriptions = await prisma.subscription.findMany({
      where: { 
        userId: dbUser.id,
        paid: true // Only paid subscriptions
      },
      include: {
        mockTest: {
          select: { id: true, title: true, description: true }
        },
        course: {
          select: { id: true, title: true, description: true, durationMonths: true }
        },
        mockBundle: {
          select: { id: true, title: true, description: true }
        },
        couponUsage: {
          include: {
            coupon: {
              select: { code: true, discountPct: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Fetch all session enrollments
    const sessionEnrollments = await prisma.sessionEnrollment.findMany({
      where: {
        userId: dbUser.id,
        paymentStatus: "SUCCESS"
      },
      include: {
        session: {
          select: { 
            id: true, 
            title: true, 
            description: true, 
            type: true, 
            duration: true,
            expiryDate: true
          }
        }
      },
      orderBy: { enrolledAt: "desc" }
    });

    // Transform subscriptions data
    const subscriptionHistory = subscriptions.map((sub) => {
      let itemType = "";
      let itemTitle = "";
      let itemDescription = "";
      let expiryDate = sub.expiresAt;

      if (sub.mockTest) {
        itemType = "Mock Test";
        itemTitle = sub.mockTest.title;
        itemDescription = sub.mockTest.description || "";
      } else if (sub.course) {
        itemType = "Course";
        itemTitle = sub.course.title;
        itemDescription = sub.course.description || "";
      } else if (sub.mockBundle) {
        itemType = "Mock Bundle";
        itemTitle = sub.mockBundle.title;
        itemDescription = sub.mockBundle.description || "";
      }

      return {
        id: sub.id,
        type: "subscription" as const,
        itemType,
        itemTitle,
        itemDescription,
        orderId: sub.razorpayOrderId,
        paymentId: sub.razorpayPaymentId || "N/A",
        originalPrice: sub.originalPrice ? sub.originalPrice / 100 : 0, // Convert paise to rupees
        actualAmountPaid: sub.actualAmountPaid ? sub.actualAmountPaid / 100 : 0,
        discountApplied: sub.discountApplied ? sub.discountApplied / 100 : 0,
        couponCode: sub.couponCode,
        paidAt: sub.paidAt,
        expiresAt: expiryDate,
        isExpired: expiryDate ? new Date(expiryDate) < new Date() : false,
      };
    });

    // Transform session enrollments data
    const sessionHistory = sessionEnrollments.map((enrollment) => {
      const isExpired = enrollment.session.expiryDate 
        ? new Date(enrollment.session.expiryDate) < new Date() 
        : false;

      return {
        id: enrollment.id,
        type: "session" as const,
        itemType: enrollment.session.type === "ONE_ON_ONE" ? "1-on-1 Session" : "Group Session",
        itemTitle: enrollment.session.title,
        itemDescription: enrollment.session.description || "",
        orderId: enrollment.razorpayOrderId || "N/A",
        paymentId: enrollment.razorpayPaymentId || "N/A",
        originalPrice: enrollment.amountPaid || 0, // Already in rupees
        actualAmountPaid: enrollment.amountPaid || 0,
        discountApplied: 0, // Calculate if you have discount tracking for sessions
        couponCode: enrollment.couponCode,
        paidAt: enrollment.enrolledAt,
        expiresAt: enrollment.session.expiryDate,
        isExpired,
        duration: enrollment.session.duration,
      };
    });

    // Combine and sort by payment date
    const allHistory = [...subscriptionHistory, ...sessionHistory]
      .filter(item => item.actualAmountPaid > 0) // ✅ Filter out ₹0 transactions
      .sort(
        (a, b) => {
          const dateA = a.paidAt ? new Date(a.paidAt).getTime() : 0;
          const dateB = b.paidAt ? new Date(b.paidAt).getTime() : 0;
          return dateB - dateA; // Most recent first
        }
      );

    return NextResponse.json({
      success: true,
      billingHistory: allHistory,
      totalTransactions: allHistory.length,
      totalSpent: allHistory.reduce((sum, item) => sum + item.actualAmountPaid, 0),
    });

  } catch (error) {
    console.error("Error fetching billing history:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch billing history",
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
