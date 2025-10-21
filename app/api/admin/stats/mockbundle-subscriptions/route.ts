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
      orderBy: {
        title: 'asc'
      }
    })

    // Get all subscriptions related to mock bundles
    const bundleSubscriptions = await prisma.subscription.findMany({
      where: {
        mockBundleId: { not: null },
        paid: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            clerkUserId: true
          }
        },
        mockBundle: {
          select: {
            id: true,
            title: true,
            basePrice: true,
            discountedPrice: true
          }
        }
      }
    })

    // Transform the data by grouping subscriptions by bundle
    const stats = mockBundles.map(bundle => {
      // Find all subscriptions for this specific bundle
      const bundleSubs = bundleSubscriptions.filter(sub => sub.mockBundleId === bundle.id)
      
      // Filter out zero-amount subscriptions (individual mocks in bundles)
      const paidSubscriptions = bundleSubs.filter(sub => {
        if (sub.actualAmountPaid !== null && sub.actualAmountPaid !== undefined) {
          return sub.actualAmountPaid > 0;
        }
        return true; // Include old records without actualAmountPaid
      });

      const totalSubscriptions = paidSubscriptions.length
      const totalRevenue = paidSubscriptions.reduce((sum: number, sub) => {
        // Use actualAmountPaid if available (handles discounts correctly)
        if (sub.actualAmountPaid !== null && sub.actualAmountPaid !== undefined) {
          return sum + (sub.actualAmountPaid / 100); // Convert paise to rupees
        }
        
        // Fallback to bundle pricing for old records
        return sum + (bundle.discountedPrice || bundle.basePrice);
      }, 0)
      
      return {
        id: bundle.id,
        title: bundle.title,
        basePrice: bundle.basePrice,
        discountedPrice: bundle.discountedPrice,
        totalSubscriptions,
        revenue: totalRevenue, // Match interface expectation
        subscriptions: paidSubscriptions.map(sub => ({
          id: sub.id,
          user: {
            id: sub.user.id,
            name: sub.user.name || 'N/A',
            email: sub.user.email,
            phoneNumber: sub.user.phoneNumber
          },
          paid: sub.paid,
          actualAmountPaid: sub.actualAmountPaid,
          amount: sub.actualAmountPaid !== null && sub.actualAmountPaid !== undefined 
            ? sub.actualAmountPaid / 100 // Convert paise to rupees
            : (bundle.discountedPrice || bundle.basePrice),
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