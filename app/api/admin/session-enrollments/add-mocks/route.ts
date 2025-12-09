import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enrollmentIds, mockIds } = body;

    if (!enrollmentIds || !Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
      return NextResponse.json(
        { error: 'Enrollment IDs are required' },
        { status: 400 }
      );
    }

    if (!mockIds || !Array.isArray(mockIds) || mockIds.length === 0) {
      return NextResponse.json(
        { error: 'Mock IDs are required' },
        { status: 400 }
      );
    }

    // Fetch enrollments to get user IDs
    const enrollments = await prisma.sessionEnrollment.findMany({
      where: {
        id: { in: enrollmentIds },
      },
      select: {
        userId: true,
      },
    });

    const userIds = [...new Set(enrollments.map((e) => e.userId))];

    // Create subscriptions for each user-mock combination
    const subscriptionsToCreate = userIds.flatMap((userId) =>
      mockIds.map((mockId) => ({
        userId,
        mockTestId: mockId,
        paid: true,
        actualAmountPaid: 0, // Gift, so 0 amount
        type: 'MOCK_TEST',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        razorpayOrderId: `GIFT_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      }))
    );

    // Create subscriptions individually to handle duplicates gracefully
    const results = await Promise.allSettled(
      subscriptionsToCreate.map((data) =>
        prisma.subscription.create({ data }).catch(() => null)
      )
    );

    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value).length;

    return NextResponse.json({
      success: true,
      message: `Successfully added ${mockIds.length} mock test(s) to ${userIds.length} student(s) (${successCount} new subscriptions created)`,
      count: successCount,
    });
  } catch (error) {
    console.error('Error adding mocks:', error);
    return NextResponse.json(
      { error: 'Failed to add mocks' },
      { status: 500 }
    );
  }
}
