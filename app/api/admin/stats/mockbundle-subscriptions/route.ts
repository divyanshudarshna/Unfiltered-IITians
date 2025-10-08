import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all mock bundles with their subscriptions
    const mockBundles = await prisma.mockBundle.findMany({
      include: {
        subscriptions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                clerkUserId: true
              }
            }
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    })

    // Transform the data
    const stats = mockBundles.map(bundle => {
      const totalSubscriptions = bundle.subscriptions.length
      const totalRevenue = bundle.subscriptions.reduce((sum: number, sub) => {
        return sum + (sub.paid ? bundle.basePrice : 0)
      }, 0)
      
      return {
        id: bundle.id,
        title: bundle.title,
        basePrice: bundle.basePrice,
        discountedPrice: bundle.discountedPrice,
        totalSubscriptions,
        totalRevenue,
        subscriptions: bundle.subscriptions.map(sub => ({
          id: sub.id,
          user: {
            id: sub.user.id,
            name: sub.user.name || 'N/A',
            email: sub.user.email,
            phoneNumber: sub.user.phoneNumber
          },
          paid: sub.paid,
          amount: sub.paid ? bundle.basePrice : 0,
          purchasedAt: sub.createdAt,
          expiresAt: sub.expiresAt
        }))
      }
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching mock bundle subscription stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}