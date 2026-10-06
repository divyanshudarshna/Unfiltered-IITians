// app/api/subscription/create/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { razorpay } from '@/lib/razorpay'
import { getDbUserFromClerk } from '@/lib/roleAuth'

export async function POST(req: Request) {
  const user = await getDbUserFromClerk()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { mockTestId } = body

  if (typeof mockTestId !== 'string') {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const mock = await prisma.mockTest.findUnique({
    where: { id: mockTestId },
  })

  if (!mock || mock.status !== 'PUBLISHED' || !mock.price) {
    return NextResponse.json({ error: 'Invalid or free mock' }, { status: 400 })
  }
  if (mock.billingMode === 'RECURRING' && mock.subscriptionEnabled) {
    return NextResponse.json({ error: 'This mock requires recurring checkout' }, { status: 409 })
  }
  const amount = Math.round(mock.price * 100)
  if (!Number.isSafeInteger(amount) || amount <= 0) return NextResponse.json({ error: 'Invalid price' }, { status: 400 })

  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `mock-${mockTestId}-${Date.now()}`,
  })

  await prisma.subscription.create({
    data: {
      userId: user.id,
      mockTestId,
      razorpayOrderId: order.id,
      originalPrice: amount,
      actualAmountPaid: amount,
      discountApplied: 0,
      paid: false,
    },
  })

  return NextResponse.json({ order })
}
