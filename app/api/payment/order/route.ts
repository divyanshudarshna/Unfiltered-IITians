import { NextResponse } from 'next/server'
import { razorpay } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { mockTestId, clerkUserId } = await req.json()

    if (!mockTestId || !clerkUserId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const mock = await prisma.mockTest.findUnique({
      where: { id: mockTestId },
    })

    if (!mock || !mock.price) {
      return NextResponse.json({ error: 'Invalid or free mock' }, { status: 400 })
    }

    const amount = mock.price * 100 // in paise
    const receipt = crypto.randomUUID().slice(0, 20)

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt,
    })

    // Create Subscription record
    await prisma.subscription.create({
      data: {
        userId: user.id,
        mockTestId,
        razorpayOrderId: order.id,
        paid: false,
      },
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (err: any) {
    console.error('❌ Razorpay Order Error:', err)
    return NextResponse.json({ error: err?.description || 'Server error' }, { status: 500 })
  }
}
