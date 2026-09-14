// app/api/payment/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getDbUserFromClerk } from "@/lib/roleAuth";
import { assertRazorpayServerConfiguration, razorpay } from "@/lib/razorpay";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const user = await getDbUserFromClerk();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    assertRazorpayServerConfiguration();
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(generated_signature, "hex");
    const receivedBuffer = Buffer.from(razorpay_signature, "hex");
    if (
      expectedBuffer.length !== receivedBuffer.length
      || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const [orderSubscriptions, orderSessionEnrollments] = await Promise.all([
      prisma.subscription.findMany({
        where: { razorpayOrderId: razorpay_order_id, userId: user.id },
        select: { actualAmountPaid: true },
      }),
      prisma.sessionEnrollment.findMany({
        where: { razorpayOrderId: razorpay_order_id, userId: user.id },
        select: { amountPaid: true, accessEndsAt: true },
      }),
    ]);
    if (orderSubscriptions.length === 0 && orderSessionEnrollments.length === 0) {
      return NextResponse.json({ error: "Payment order not found" }, { status: 404 });
    }

    const expectedAmountPaise = orderSubscriptions.length > 0
      ? orderSubscriptions.reduce(
        (total, subscription) => total + (subscription.actualAmountPaid ?? 0),
        0,
      )
      : Math.round((orderSessionEnrollments[0].amountPaid ?? 0) * 100);

    const providerPayment = await razorpay.payments.fetch(razorpay_payment_id) as unknown as Record<string, unknown>;
    const providerAmount = typeof providerPayment.amount === "number"
      ? providerPayment.amount
      : Number(providerPayment.amount);
    if (
      providerPayment.order_id !== razorpay_order_id
      || providerPayment.status !== "captured"
      || providerPayment.currency !== "INR"
      || !Number.isInteger(providerAmount)
      || providerAmount !== expectedAmountPaise
    ) {
      return NextResponse.json({ error: "Razorpay payment does not match this order" }, { status: 409 });
    }
    const paidAt = new Date();

    const expiredSessionEnrollment = orderSessionEnrollments.some(
      (enrollment) => enrollment.accessEndsAt && enrollment.accessEndsAt <= paidAt,
    );
    if (expiredSessionEnrollment) {
      return NextResponse.json(
        { error: "This guidance session expired before payment confirmation. Please contact support." },
        { status: 409 },
      );
    }

    const { pendingSessionEnrollmentIds, updatedSubscriptions, updatedEnrollments } =
      await prisma.$transaction(async (tx) => {
        const pendingSessionEnrollments = await tx.sessionEnrollment.findMany({
          where: {
            razorpayOrderId: razorpay_order_id,
            userId: user.id,
            paymentStatus: { not: "SUCCESS" },
          },
          select: { id: true },
        });
        const updatedSubscriptions = await tx.subscription.updateMany({
          where: { razorpayOrderId: razorpay_order_id, userId: user.id, paid: false },
          data: {
            paid: true,
            razorpayPaymentId: razorpay_payment_id,
            paidAt,
          },
        });
        const updatedEnrollments = await tx.sessionEnrollment.updateMany({
          where: {
            razorpayOrderId: razorpay_order_id,
            userId: user.id,
            paymentStatus: { not: "SUCCESS" },
          },
          data: {
            paymentStatus: "SUCCESS",
            razorpayPaymentId: razorpay_payment_id,
            enrolledAt: paidAt,
            completedAt: paidAt,
          },
        });
        return {
          pendingSessionEnrollmentIds: pendingSessionEnrollments.map((enrollment) => enrollment.id),
          updatedSubscriptions,
          updatedEnrollments,
        };
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
