import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin access
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Fetch all published mocks
    const mocks = await prisma.mockTest.findMany({
      where: {
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        actualPrice: true,
        difficulty: true,
        duration: true,
        tags: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      mocks
    });

  } catch (error) {
    console.error('Error fetching mocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mocks' },
      { status: 500 }
    );
  }
}
