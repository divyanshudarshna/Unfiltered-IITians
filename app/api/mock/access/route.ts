import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const mockTestId = searchParams.get('mockTestId')

    if (!userId || !mockTestId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const mock = await prisma.mockTest.findUnique({ where: { id: mockTestId } })
    if (!mock) return NextResponse.json({ error: 'Mock not found' }, { status: 404 })

    if (mock.price === 0) return NextResponse.json({ access: true, reason: 'Free mock' })

    const paid = await prisma.subscription.findFirst({
      where: { userId, mockTestId, paid: true }
    })

    if (paid) return NextResponse.json({ access: true, reason: 'Paid mock' })

    return NextResponse.json({ access: false, reason: 'Payment required' })
  } catch (error) {
    console.error('❌ Access check error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
