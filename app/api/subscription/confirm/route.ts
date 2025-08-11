// app/api/subscription/confirm/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const body = await req.json()
  const { razorpayOrderId } = body

  if (!razorpayOrderId) {
    return NextResponse.json({ error: 'Missing Razorpay Order ID' }, { status: 400 })
  }

  const subscription = await prisma.subscription.updateMany({
    where: { razorpayOrderId },
    data: { paid: true },
  })

  return NextResponse.json({ success: true, subscription })
}
