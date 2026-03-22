// app/api/billing/receipt/[id]/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    const { id: receiptId } = await params;
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find user in database
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        phoneNumber: true 
      }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Try to find in subscriptions first
    const subscription = await prisma.subscription.findFirst({
      where: { 
        id: receiptId,
        userId: dbUser.id,
        paid: true
      },
      include: {
        mockTest: {
          select: { id: true, title: true, description: true }
        },
        course: {
          select: { id: true, title: true, description: true }
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
      }
    });

    if (subscription) {
      // Subscription found
      let itemType = "";
      let itemTitle = "";
      let itemDescription = "";

      if (subscription.mockTest) {
        itemType = "Mock Test";
        itemTitle = subscription.mockTest.title;
        itemDescription = subscription.mockTest.description || "";
      } else if (subscription.course) {
        itemType = "Course";
        itemTitle = subscription.course.title;
        itemDescription = subscription.course.description || "";
      } else if (subscription.mockBundle) {
        itemType = "Mock Bundle";
        itemTitle = subscription.mockBundle.title;
        itemDescription = subscription.mockBundle.description || "";
      }

      const receiptData = {
        receiptNumber: `REC-${subscription.id.slice(-8).toUpperCase()}`,
        orderId: subscription.razorpayOrderId,
        paymentId: subscription.razorpayPaymentId || "N/A",
        paidAt: subscription.paidAt,
        customerName: dbUser.name || "N/A",
        customerEmail: dbUser.email,
        customerPhone: dbUser.phoneNumber || "N/A",
        itemType,
        itemTitle,
        itemDescription,
        originalPrice: subscription.originalPrice ? subscription.originalPrice / 100 : 0,
        discountApplied: subscription.discountApplied ? subscription.discountApplied / 100 : 0,
        actualAmountPaid: subscription.actualAmountPaid ? subscription.actualAmountPaid / 100 : 0,
        couponCode: subscription.couponCode,
        expiresAt: subscription.expiresAt,
      };

      return NextResponse.json({
        success: true,
        receipt: receiptData
      });
    }

    // Try to find in session enrollments
    const sessionEnrollment = await prisma.sessionEnrollment.findFirst({
      where: {
        id: receiptId,
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
            expiryDate: true
          }
        }
      }
    });

    if (sessionEnrollment) {
      const receiptData = {
        receiptNumber: `REC-${sessionEnrollment.id.slice(-8).toUpperCase()}`,
        orderId: sessionEnrollment.razorpayOrderId || "N/A",
        paymentId: sessionEnrollment.razorpayPaymentId || "N/A",
        paidAt: sessionEnrollment.enrolledAt,
        customerName: sessionEnrollment.studentName || dbUser.name || "N/A",
        customerEmail: sessionEnrollment.studentEmail || dbUser.email,
        customerPhone: sessionEnrollment.studentPhone || dbUser.phoneNumber || "N/A",
        itemType: sessionEnrollment.session.type === "ONE_ON_ONE" ? "1-on-1 Session" : "Group Session",
        itemTitle: sessionEnrollment.session.title,
        itemDescription: sessionEnrollment.session.description || "",
        originalPrice: sessionEnrollment.amountPaid || 0,
        discountApplied: 0,
        actualAmountPaid: sessionEnrollment.amountPaid || 0,
        couponCode: sessionEnrollment.couponCode,
        expiresAt: sessionEnrollment.session.expiryDate,
      };

      return NextResponse.json({
        success: true,
        receipt: receiptData
      });
    }

    // Receipt not found
    return NextResponse.json(
      { error: "Receipt not found" },
      { status: 404 }
    );

  } catch (error) {
    console.error("Error fetching receipt:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipt" },
      { status: 500 }
    );
  }
}
