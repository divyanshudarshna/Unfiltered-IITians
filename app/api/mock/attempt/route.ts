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

    // ✅ Check access control for paid mocks
    if (mockTest.price > 0) {
      const hasAccess = await checkMockAccess(user.id, mockTestId)
      
      if (!hasAccess.allowed) {
        let errorMessage = 'You need to purchase this mock test to attempt it.'
        
        switch (hasAccess.reason) {
          case 'no_subscription':
            errorMessage = 'You need to purchase this mock test or a bundle containing it to attempt.'
            break
          case 'access_check_error':
            errorMessage = 'Unable to verify your subscription. Please try again.'
            break
        }
        
        return NextResponse.json({ 
          error: errorMessage,
          code: 'ACCESS_DENIED',
          reason: hasAccess.reason
        }, { status: 403 })
      }
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

// Helper function to check mock access - using same logic as mocks page
async function checkMockAccess(userId: string, mockTestId: string) {
  try {
    console.log(`🔍 [ATTEMPT] Checking access for user ${userId} to mock ${mockTestId}`)
    
    // Get mock details
    const mock = await prisma.mockTest.findUnique({
      where: { id: mockTestId },
      select: { price: true }
    })

    if (!mock) {
      console.log(`❌ [ATTEMPT] Mock ${mockTestId} not found`)
      return { allowed: false, reason: 'mock_not_found' }
    }

    console.log(`💰 [ATTEMPT] Mock price: ${mock.price}`)

    // If mock is free, allow access
    if (mock.price === 0) {
      console.log(`✅ [ATTEMPT] Free mock - access allowed`)
      return { allowed: true, reason: 'free_mock', subscriptionType: 'free' }
    }

    // Use same query as mocks page - check for paid subscriptions to this specific mock
    const userSubscription = await prisma.subscription.findFirst({
      where: { 
        userId, 
        mockTestId,
        paid: true 
      },
      include: {
        mockBundle: {
          select: { id: true, title: true }
        }
      }
    })

    if (userSubscription) {
      console.log(`✅ [ATTEMPT] Subscription found: ${userSubscription.id}`)
      const subscriptionType = userSubscription.mockBundle ? 'bundle' : 'individual'
      const bundleInfo = userSubscription.mockBundle ? ` (from bundle: ${userSubscription.mockBundle.title})` : ''
      console.log(`📦 [ATTEMPT] Subscription type: ${subscriptionType}${bundleInfo}`)
      return { allowed: true, reason: 'subscription_found', subscriptionType }
    }

    console.log(`❌ [ATTEMPT] No subscription found for mock ${mockTestId}`)
    return { allowed: false, reason: 'no_subscription' }
  } catch (error) {
    console.error('❌ [ATTEMPT] Error checking mock access:', error)
    return { allowed: false, reason: 'access_check_error' }
  }
}
