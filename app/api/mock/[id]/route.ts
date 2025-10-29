import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth, clerkClient } from '@clerk/nextjs/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkUserId } = getAuth(req)
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

    // If user is not logged in, return basic mock info without access control
    if (!clerkUserId) {
      return NextResponse.json({ mock, hasAccess: false, reason: 'authentication_required' })
    }

    // Find user by clerkUserId
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ mock, hasAccess: false, reason: 'user_not_found' })
    }

    // Check access control (includes admin check)
    const hasAccess = await checkMockAccess(user.id, id, user.role, clerkUserId)
    
    // Get user's attempt count for this mock
    const attemptCount = await prisma.mockAttempt.count({
      where: {
        userId: user.id,
        mockTestId: id
      }
    })

    // Calculate max attempts based on mock price
    const maxAttempts = mock.price > 0 ? 10 : 3
    const attemptsRemaining = Math.max(0, maxAttempts - attemptCount)
    
    // console.log(`📊 Attempt stats: ${attemptCount}/${maxAttempts} used, ${attemptsRemaining} remaining`)
    
    return NextResponse.json({ 
      mock, 
      hasAccess: hasAccess.allowed,
      reason: hasAccess.reason,
      subscriptionType: hasAccess.subscriptionType,
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

// Helper function to check mock access - using same logic as mocks page
async function checkMockAccess(userId: string, mockTestId: string, userRole?: string, clerkUserId?: string) {
  try {
    // console.log(`🔍 Checking access for user ${userId} to mock ${mockTestId}`)
    
    // Check if user is admin (from database role)
    if (userRole === 'ADMIN') {
      // console.log(`✅ Admin access granted from database role`)
      return { allowed: true, reason: 'admin_access', subscriptionType: 'admin' }
    }

    // Check if user is admin (from Clerk metadata)
    if (clerkUserId) {
      try {
        const client = await clerkClient()
        const clerkUser = await client.users.getUser(clerkUserId)
        if (clerkUser.publicMetadata?.role === 'ADMIN') {
          // console.log(`✅ Admin access granted from Clerk metadata`)
          return { allowed: true, reason: 'admin_access', subscriptionType: 'admin' }
        }
      } catch (clerkError) {
        // console.log('⚠️ Could not fetch Clerk user data, continuing with regular access check')
      }
    }
    
    // Get mock details
    const mock = await prisma.mockTest.findUnique({
      where: { id: mockTestId },
      select: { price: true }
    })

    if (!mock) {
      // console.log(`❌ Mock ${mockTestId} not found`)
      return { allowed: false, reason: 'mock_not_found' }
    }

    // console.log(`💰 Mock price: ${mock.price}`)

    // If mock is free, allow access
    if (mock.price === 0) {
      // console.log(`✅ Free mock - access allowed`)
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
      // console.log(`✅ Subscription found: ${userSubscription.id}`)
      const subscriptionType = userSubscription.mockBundle ? 'bundle' : 'individual'
      // console.log(`📦 Subscription type: ${subscriptionType}`)
      return { allowed: true, reason: 'subscription_found', subscriptionType }
    }

    // console.log(`❌ No subscription found for mock ${mockTestId}`)
    return { allowed: false, reason: 'no_subscription' }
  } catch (error) {
    // console.error('❌ Error checking mock access:', error)
    return { allowed: false, reason: 'access_check_error' }
  }
}