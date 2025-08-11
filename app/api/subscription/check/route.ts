// app/api/subscription/check/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const mockTestId = searchParams.get('mockTestId')

  if (!userId || !mockTestId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      mockTestId,
      paid: true,
    },
  })

  return NextResponse.json({ hasAccess: !!subscription })
}
