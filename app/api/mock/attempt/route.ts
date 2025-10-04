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

     const attemptCount = await prisma.mockAttempt.count({
      where: {
        userId: user.id,
        mockTestId: mockTestId,
      },
    })

    // ✅ Decide max attempts (paid = 10, free = 3)
    const maxAttempts = mockTest.price > 0 ? 10 : 3

    if (attemptCount >= maxAttempts) {
      return NextResponse.json(
        { error: `You have reached the maximum of ${maxAttempts} attempts for this test.` },
        { status: 403 }
      )
    }

    // ✅ Create attempt with user.id
    const attempt = await prisma.mockAttempt.create({
      data: {
        userId: user.id,
        mockTestId,
        startedAt: new Date(),
        answers: {}, // ✅ Initialize as empty object, not array
        score: 0,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
        totalQuestions: 0,
        percentage: 0,
      },
    })

    return NextResponse.json({ attempt }, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating attempt:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
