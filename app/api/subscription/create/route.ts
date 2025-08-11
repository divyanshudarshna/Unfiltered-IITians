// app/api/subscription/create/route.ts
import Razorpay from 'razorpay'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: Request) {
  const body = await req.json()
  const { userId, mockTestId } = body

  if (!userId || !mockTestId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const mock = await prisma.mockTest.findUnique({
    where: { id: mockTestId },
  })

  if (!mock || !mock.price) {
    return NextResponse.json({ error: 'Invalid or free mock' }, { status: 400 })
  }

  const order = await razorpay.orders.create({
    amount: mock.price * 100, // in paisa
    currency: 'INR',
    receipt: `mock-${mockTestId}-${Date.now()}`,
  })

  await prisma.subscription.create({
    data: {
      userId,
      mockTestId,
      razorpayOrderId: order.id,
      paid: false,
    },
  })

  return NextResponse.json({ order })
}
