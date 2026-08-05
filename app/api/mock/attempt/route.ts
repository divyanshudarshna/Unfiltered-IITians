import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getMockEntitlement } from '@/lib/mockAccess'

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const { mockTestId } = await req.json()

    if (!mockTestId) {
      return NextResponse.json({ error: 'Missing mock test ID' }, { status: 400 })
    }

    const entitlement = await getMockEntitlement(clerkUserId, mockTestId)
    if (!entitlement.allowed || !entitlement.userId) {
      return NextResponse.json({
        error: 'You do not have access to this mock test.',
        code: 'ACCESS_DENIED',
        reason: entitlement.reason,
      }, { status: 403 })
    }

    const mockTest = await prisma.mockTest.findUnique({
      where: { id: mockTestId },
      select: { price: true },
    })
    if (!mockTest) return NextResponse.json({ error: 'Mock test not found' }, { status: 404 })

     const attemptCount = await prisma.mockAttempt.count({
      where: {
        userId: entitlement.userId,
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
        userId: entitlement.userId,
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
async function checkMockAccess(userId: string, mockTestId: string, userRole?: string, clerkUserId?: string) {
  try {
    // console.log(`🔍 [ATTEMPT] Checking access for user ${userId} to mock ${mockTestId}`)
    
    // Check if user is admin (from database role)
    if (userRole === 'ADMIN') {
      // console.log(`✅ [ATTEMPT] Admin access granted from database role`)
      return { allowed: true, reason: 'admin_access', subscriptionType: 'admin' }
    }

    // Check if user is admin (from Clerk metadata)
    if (clerkUserId) {
      try {
        const client = await clerkClient()
        const clerkUser = await client.users.getUser(clerkUserId)
        if (clerkUser.publicMetadata?.role === 'ADMIN') {
          // console.log(`✅ [ATTEMPT] Admin access granted from Clerk metadata`)
          return { allowed: true, reason: 'admin_access', subscriptionType: 'admin' }
        }
      } catch (clerkError) {
        // console.log('⚠️ [ATTEMPT] Could not fetch Clerk user data, continuing with regular access check')
      }
    }
    
    // Get mock details
    const mock = await prisma.mockTest.findUnique({
      where: { id: mockTestId },
      select: { price: true }
    })

    if (!mock) {
      // console.log(`❌ [ATTEMPT] Mock ${mockTestId} not found`)
      return { allowed: false, reason: 'mock_not_found' }
    }

    // console.log(`💰 [ATTEMPT] Mock price: ${mock.price}`)

    // If mock is free, allow access
    if (mock.price === 0) {
      // console.log(`✅ [ATTEMPT] Free mock - access allowed`)
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
      // console.log(`✅ [ATTEMPT] Subscription found: ${userSubscription.id}`)
      const subscriptionType = userSubscription.mockBundle ? 'bundle' : 'individual'
      // console.log(`📦 [ATTEMPT] Subscription type: ${subscriptionType}`)
      return { allowed: true, reason: 'subscription_found', subscriptionType }
    }

    // console.log(`❌ [ATTEMPT] No subscription found for mock ${mockTestId}`)
    return { allowed: false, reason: 'no_subscription' }
  } catch (error) {
    // console.error('❌ [ATTEMPT] Error checking mock access:', error)
    return { allowed: false, reason: 'access_check_error' }
  }
}
