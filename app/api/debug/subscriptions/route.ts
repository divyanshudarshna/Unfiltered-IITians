import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(req)
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user by clerkUserId
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all user subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
      include: {
        mockTest: {
          select: { id: true, title: true, price: true }
        },
        mockBundle: {
          select: { id: true, title: true, mockIds: true }
        },
        course: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get all mock tests for reference
    const allMocks = await prisma.mockTest.findMany({
      select: { id: true, title: true, price: true },
      orderBy: { title: 'asc' }
    })

    // Get all mock bundles for reference
    const allBundles = await prisma.mockBundle.findMany({
      select: { id: true, title: true, mockIds: true },
      orderBy: { title: 'asc' }
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        paid: sub.paid,
        expiresAt: sub.expiresAt,
        createdAt: sub.createdAt,
        type: sub.mockTestId ? 'individual_mock' : sub.mockBundleId ? 'bundle' : sub.courseId ? 'course' : 'unknown',
        mockTest: sub.mockTest,
        mockBundle: sub.mockBundle,
        course: sub.course
      })),
      allMocks,
      allBundles,
      debug: {
        totalSubscriptions: subscriptions.length,
        paidSubscriptions: subscriptions.filter(s => s.paid).length,
        bundleSubscriptions: subscriptions.filter(s => s.mockBundleId && s.paid).length,
        mockSubscriptions: subscriptions.filter(s => s.mockTestId && s.paid).length,
        courseSubscriptions: subscriptions.filter(s => s.courseId && s.paid).length
      }
    })
  } catch (error) {
    console.error('❌ Debug subscription error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}