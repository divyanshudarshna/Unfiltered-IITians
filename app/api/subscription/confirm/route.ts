// app/api/subscription/confirm/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { razorpayOrderId, couponData } = body

    if (!razorpayOrderId) {
      return NextResponse.json({ error: 'Missing Razorpay Order ID' }, { status: 400 })
    }

    // Find the subscription that was paid
    const subscription = await prisma.subscription.findFirst({
      where: { razorpayOrderId },
      include: { user: true, course: true }
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Update subscription to paid
    const updatedSubscription = await prisma.subscription.updateMany({
      where: { razorpayOrderId },
      data: { paid: true },
    })

    // If coupon was used, track the usage
    if (couponData && couponData.couponId) {
      // Increment coupon usage count
      await prisma.coupon.update({
        where: { id: couponData.couponId },
        data: { usageCount: { increment: 1 } }
      });

      // Create coupon usage record
      await prisma.couponUsage.create({
        data: {
          couponId: couponData.couponId,
          userId: subscription.userId,
          subscriptionId: subscription.id,
          discountAmount: couponData.discountAmount
        }
      });
    }

    return NextResponse.json({ success: true, subscription: updatedSubscription })
  } catch (error) {
    console.error('❌ Subscription confirmation error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
