import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { getMockEntitlement } from "@/lib/mockAccess"

function withoutAnswers(questions: unknown) {
  const parsed = Array.isArray(questions) ? questions : JSON.parse(String(questions))
  return parsed.map(({ answer: _answer, ...question }: Record<string, unknown>) => question)
}

function questionSummaries(questions: unknown) {
  const parsed = Array.isArray(questions) ? questions : JSON.parse(String(questions))
  return parsed.map(({ type }: { type?: unknown }) => ({ type: String(type ?? "UNKNOWN") }))
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkUserId } = await auth()
    const { id } = await params
    
    const mock = await prisma.mockTest.findUnique({ 
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        actualPrice: true,
        duration: true,
        questions: true,
        tags: true,
        difficulty: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    })
    
    if (!mock) {
      return NextResponse.json({ error: 'Mock not found' }, { status: 404 })
    }

    const entitlement = await getMockEntitlement(clerkUserId, id)
    const safeMock = { ...mock, questions: withoutAnswers(mock.questions) }
    if (!entitlement.allowed) {
      return NextResponse.json({
        mock: { ...mock, questions: questionSummaries(mock.questions) },
        hasAccess: false,
        reason: entitlement.reason,
      })
    }
    
    // Get user's attempt count for this mock
    const attemptCount = await prisma.mockAttempt.count({
      where: {
        userId: entitlement.userId,
        mockTestId: id
      }
    })

    // Calculate max attempts based on mock price
    const maxAttempts = mock.price > 0 ? 10 : 3
    const attemptsRemaining = Math.max(0, maxAttempts - attemptCount)
    
    // console.log(`📊 Attempt stats: ${attemptCount}/${maxAttempts} used, ${attemptsRemaining} remaining`)
    
    return NextResponse.json({ 
      mock: safeMock,
      hasAccess: true,
      reason: entitlement.reason,
      subscriptionType: entitlement.subscriptionType,
      attemptCount,
      maxAttempts,
      attemptsRemaining,
      canAttempt: attemptsRemaining > 0
    })
  } catch (error) {
    // console.error('❌ Fetch mock error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
