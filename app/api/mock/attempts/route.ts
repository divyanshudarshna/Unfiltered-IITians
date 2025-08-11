// app/api/mock/attempts/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export async function GET(req: Request) {
  try {
    

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const attempts = await prisma.mockAttempt.findMany({
      where: { userId },
      include: { mockTest: true },
      orderBy: { submittedAt: 'desc' }
    })

    return NextResponse.json({ attempts })
  } catch (error) {
    console.error('❌ Error fetching attempts:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}