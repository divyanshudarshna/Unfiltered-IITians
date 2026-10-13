import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Paid reviews can exist before an Enrollment is created.
    const reviewCourses = await prisma.commerceCheckout.findMany({ where: { productType: 'COURSE', status: { in: ['REQUIRES_REVIEW', 'CANCELLED'] } }, select: { productId: true }, distinct: ['productId'] });
    const coursesWithEnrollments = await prisma.course.findMany({
      where: {
        OR: [{ enrollments: { some: {} } }, { id: { in: reviewCourses.map(row => row.productId) } }],
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        title: 'asc',
      },
    });

    return NextResponse.json({
      courses: coursesWithEnrollments,
    });
  } catch (error) {
    console.error('Error fetching courses with enrollments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
