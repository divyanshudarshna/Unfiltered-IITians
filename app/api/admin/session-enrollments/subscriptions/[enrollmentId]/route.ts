import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { enrollmentId: string } }
) {
  try {
    const { enrollmentId } = params;

    // Fetch the enrollment to get user ID
    const enrollment = await prisma.sessionEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { userId: true },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Fetch all paid subscriptions for this user
    const [subscriptions, sessionEnrollments] = await Promise.all([
      prisma.subscription.findMany({
        where: {
          userId: enrollment.userId,
          paid: true,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
            },
          },
          mockTest: {
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
              actualPrice: true,
              difficulty: true,
            },
          },
          mockBundle: {
            select: {
              id: true,
              title: true,
              description: true,
              basePrice: true,
              discountedPrice: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.sessionEnrollment.findMany({
        where: {
          userId: enrollment.userId,
          paymentStatus: 'SUCCESS',
        },
        include: {
          session: {
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
              duration: true,
              expiryDate: true,
            },
          },
        },
        orderBy: {
          enrolledAt: 'desc',
        },
      }),
    ]);

    // Transform subscriptions to a unified format
    const transformedSubscriptions = subscriptions.map((sub) => {
      let type = 'Unknown';
      let title = 'Unknown';
      let description = null;
      let originalPrice = 0;
      let difficulty = null;

      if (sub.courseId && sub.course) {
        type = 'Course';
        title = sub.course.title || 'Unknown Course';
        description = sub.course.description || '';
        originalPrice = sub.course.price || 0;
      } else if (sub.mockTestId && sub.mockTest) {
        type = 'Mock Test';
        title = sub.mockTest.title || 'Unknown Mock Test';
        description = sub.mockTest.description || '';
        originalPrice = sub.mockTest.actualPrice || sub.mockTest.price || 0;
        difficulty = sub.mockTest.difficulty || 'N/A';
      } else if (sub.mockBundleId && sub.mockBundle) {
        type = 'Mock Bundle';
        title = sub.mockBundle.title || 'Unknown Bundle';
        description = sub.mockBundle.description || '';
        originalPrice = sub.mockBundle.basePrice || 0;
      }

      const actualAmountPaid = sub.actualAmountPaid || 0;
      const discountApplied = originalPrice - (actualAmountPaid / 100);

      return {
        id: sub.id,
        type,
        title,
        description,
        difficulty,
        actualAmountPaid: actualAmountPaid / 100,
        originalPrice,
        discountApplied,
        couponCode: sub.couponCode,
        paidAt: sub.createdAt,
        expiresAt: sub.expiresAt,
        paid: sub.paid,
      };
    });

    // Transform session enrollments
    const transformedSessionEnrollments = sessionEnrollments.map((enrollment) => {
      const actualAmountPaid = enrollment.amountPaid || 0; // Already in rupees for sessions
      const originalPrice = enrollment.session?.price || 0;
      const discountApplied = originalPrice - actualAmountPaid;
      
      return {
        id: enrollment.id,
        type: 'Session',
        title: enrollment.session?.title || 'Unknown Session',
        description: enrollment.session?.description || '',
        difficulty: null,
        actualAmountPaid,
        originalPrice,
        discountApplied: discountApplied > 0 ? discountApplied : 0,
        couponCode: enrollment.couponCode,
        paidAt: enrollment.enrolledAt,
        expiresAt: enrollment.session?.expiryDate || null,
        paid: enrollment.paymentStatus === 'SUCCESS',
      };
    });

    // Combine and sort by date
    const allSubscriptions = [...transformedSubscriptions, ...transformedSessionEnrollments].sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
    );

    return NextResponse.json({ subscriptions: allSubscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
