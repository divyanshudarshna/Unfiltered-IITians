import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("🪵 Request Body:", body)
    const { clerkUserId, mockTestId } = body

    if (!clerkUserId || !mockTestId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ✅ Find user by clerkUserId
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ✅ Validate mock test
    const mockTest = await prisma.mockTest.findUnique({
      where: { id: mockTestId },
    })

    if (!mockTest) {
      return NextResponse.json({ error: 'Mock test not found' }, { status: 404 })
    }

    // ✅ Create attempt with user.id
    const attempt = await prisma.mockAttempt.create({
      data: {
        userId: user.id,
        mockTestId,
        startedAt: new Date(),
         answers: [], // ✅ Add this line to satisfy Prisma schema
      },
    })

    return NextResponse.json({ attempt }, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating attempt:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
