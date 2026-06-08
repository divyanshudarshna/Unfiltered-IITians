// app/api/payment/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // --- Verify Razorpay signature ---
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      // Mark enrollments/subscriptions as FAILED (optional)
      await prisma.sessionEnrollment.updateMany({
        where: { razorpayOrderId: razorpay_order_id },
        data: {
          paymentStatus: "FAILED",
        },
      });

      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const pendingSessionEnrollments = await prisma.sessionEnrollment.findMany({
      where: {
        razorpayOrderId: razorpay_order_id,
        paymentStatus: { not: "SUCCESS" },
      },
      select: { id: true },
    });
    const pendingSessionEnrollmentIds = pendingSessionEnrollments.map((enrollment) => enrollment.id);

    // --- Update Mock Subscriptions (if linked to order) ---
    const updatedSubscriptions = await prisma.subscription.updateMany({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        paid: true,
        razorpayPaymentId: razorpay_payment_id,
        paidAt: new Date(),
      },
    });

    // --- Update Session Enrollments (if linked to order) ---
    const updatedEnrollments = await prisma.sessionEnrollment.updateMany({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        paymentStatus: "SUCCESS", // ✅ match enum
        razorpayPaymentId: razorpay_payment_id,
        // If you want payment timestamp, add paymentCompletedAt in schema
      },
    });

    if (pendingSessionEnrollmentIds.length > 0) {
      const sessionEnrollments = await prisma.sessionEnrollment.findMany({
        where: { id: { in: pendingSessionEnrollmentIds } },
        include: {
          session: { select: { title: true } },
          user: { select: { name: true, email: true } },
        },
      });

      await Promise.all(
        sessionEnrollments.map(async (enrollment) => {
          const emailResult = await sendEmail({
            to: enrollment.studentEmail || enrollment.user.email,
            template: "guidance_session",
            data: {
              userName: enrollment.studentName || enrollment.user.name || "Student",
              sessionName: enrollment.session.title,
              purchaseAmount: enrollment.amountPaid?.toString(),
            },
          });

          if (!emailResult.success) {
            console.error("❌ Failed to send session booking email:", emailResult.error);
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      updatedSubscriptions,
      updatedEnrollments,
    });
  } catch (err) {
    console.error("❌ Payment verification error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
