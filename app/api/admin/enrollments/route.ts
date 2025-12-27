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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') || '';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'enrolledAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (courseId && courseId !== 'all') {
      where.courseId = courseId;
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { course: { title: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Get total count
    const total = await prisma.enrollment.count({ where });

    // Build orderBy
    let orderBy: any = {};
    if (sortBy === 'enrolledAt') {
      orderBy = { enrolledAt: sortOrder };
    } else if (sortBy === 'userName') {
      orderBy = { user: { name: sortOrder } };
    } else if (sortBy === 'courseName') {
      orderBy = { course: { title: sortOrder } };
    } else if (sortBy === 'expiresAt') {
      orderBy = { expiresAt: sortOrder };
    }

    // Fetch enrollments with user and course details
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            clerkUserId: true,
            name: true,
            email: true,
            profileImageUrl: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            price: true,
            durationMonths: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });

    // Fetch subscription data for each enrollment to get actual amount paid
    const enrollmentsWithAmount = await Promise.all(
      enrollments.map(async (enrollment) => {
        const subscription = await prisma.subscription.findFirst({
          where: {
            userId: enrollment.userId,
            courseId: enrollment.courseId,
            paid: true
          },
          select: {
            actualAmountPaid: true,
            couponCode: true
          },
          orderBy: {
            paidAt: 'desc'
          }
        });

        // Get total contents in the course
        const totalContents = await prisma.content.count({
          where: { courseId: enrollment.courseId }
        });

        // Get course progress data
        const courseProgressData = await prisma.courseProgress.findMany({
          where: {
            userId: enrollment.userId,
            courseId: enrollment.courseId
          },
          select: {
            completed: true,
            quizScore: true,
            totalQuizQuestions: true
          }
        });

        // Calculate progress percentage
        const completedContents = courseProgressData.filter(cp => cp.completed).length;
        const courseProgress = totalContents > 0 
          ? Math.round((completedContents / totalContents) * 100) 
          : 0;

        // Calculate average quiz score
        const quizScores = courseProgressData
          .filter(cp => cp.quizScore !== null && cp.totalQuizQuestions !== null && cp.totalQuizQuestions > 0)
          .map(cp => (cp.quizScore! / cp.totalQuizQuestions!) * 100);
        
        const avgQuizScore = quizScores.length > 0
          ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length)
          : null;

        return {
          ...enrollment,
          actualAmountPaid: subscription?.actualAmountPaid || null,
          couponCode: subscription?.couponCode || null,
          courseProgress,
          avgQuizScore
        };
      })
    );

    return NextResponse.json({
      enrollments: enrollmentsWithAmount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}
