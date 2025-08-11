import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const mocks = await prisma.mockTest.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ mocks })
  } catch (error) {
    console.error('❌ Fetch mocks error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
