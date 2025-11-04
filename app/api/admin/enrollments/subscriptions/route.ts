import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const enrollmentId = searchParams.get('enrollmentId');

    if (!enrollmentId) {
      return NextResponse.json({ error: 'enrollmentId is required' }, { status: 400 });
    }

    // Fetch enrollment details
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        userId: true,
        user: {
          select: {
            name: true,
            email: true
          }
        },
        course: {
          select: {
            title: true
          }
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Fetch all subscriptions (mocks and courses) for this user
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: enrollment.userId
      },
      include: {
        mockTest: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        mockBundle: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      },
      orderBy: {
        paidAt: 'desc'
      }
    });

    // Format the response
    const formattedSubscriptions = subscriptions.map(sub => {
      let type = 'Mock Bundle';
      if (sub.mockTestId) {
        type = 'Mock Test';
      } else if (sub.courseId) {
        type = 'Course';
      }

      return {
        id: sub.id,
        type,
        title: sub.mockTest?.title || sub.course?.title || sub.mockBundle?.title || 'Unknown',
        description: sub.mockTest?.description || sub.course?.description || sub.mockBundle?.description,
        difficulty: sub.mockTest?.difficulty,
        actualAmountPaid: sub.actualAmountPaid,
        originalPrice: sub.originalPrice,
        discountApplied: sub.discountApplied,
        couponCode: sub.couponCode,
        paidAt: sub.paidAt,
        expiresAt: sub.expiresAt,
        paid: sub.paid
      };
    });

    return NextResponse.json({
      user: {
        name: enrollment.user.name,
        email: enrollment.user.email
      },
      courseName: enrollment.course.title,
      subscriptions: formattedSubscriptions,
      totalSubscriptions: formattedSubscriptions.length
    });

  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
