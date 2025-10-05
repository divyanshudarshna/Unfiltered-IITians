import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const mockId = searchParams.get('mockId')
    const bundleId = searchParams.get('bundleId')

    if (!mockId) {
      return NextResponse.json({ error: 'mockId is required' }, { status: 400 })
    }

    // Get mock details
    const mock = await prisma.mockTest.findUnique({
      where: { id: mockId },
      select: { id: true, title: true, price: true }
    })

    if (!mock) {
      return NextResponse.json({ error: 'Mock not found' }, { status: 404 })
    }

    // Get all bundles or specific bundle
    const bundles = bundleId 
      ? await prisma.mockBundle.findMany({
          where: { id: bundleId },
          select: { id: true, title: true, mockIds: true }
        })
      : await prisma.mockBundle.findMany({
          select: { id: true, title: true, mockIds: true }
        })

    // Check which bundles contain this mock
    const bundleResults = bundles.map(bundle => {
      const includesResult = bundle.mockIds?.includes(mockId)
      const findResult = bundle.mockIds?.find(id => id === mockId)
      const someResult = bundle.mockIds?.some(id => id === mockId)
      
      return {
        bundleId: bundle.id,
        bundleTitle: bundle.title,
        mockIds: bundle.mockIds,
        mockIdsLength: bundle.mockIds?.length || 0,
        targetMockId: mockId,
        targetMockIdType: typeof mockId,
        comparisons: {
          includes: includesResult,
          find: findResult,
          some: someResult
        },
        individualComparisons: bundle.mockIds?.map((id, index) => ({
          index,
          id,
          type: typeof id,
          equals: id === mockId,
          strictEquals: id === mockId
        })) || []
      }
    })

    return NextResponse.json({
      mock,
      targetMockId: mockId,
      bundleResults,
      summary: {
        totalBundles: bundles.length,
        bundlesContainingMock: bundleResults.filter(b => b.comparisons.includes).length
      }
    })
  } catch (error) {
    console.error('❌ Mock bundle test error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}