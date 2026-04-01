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

    // ✅ OPTIMIZED: Fetch all data in minimal queries instead of N+1
    // Uses new composite indexes for fast lookups
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
            durationMonths: true,
            _count: {
              select: { contents: true } // ✅ Get content count in main query
            }
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });

    // ✅ OPTIMIZATION: Batch fetch all subscriptions in one query
    const userCourseIds = enrollments.map(e => ({ 
      userId: e.userId, 
      courseId: e.courseId 
    }));
    
    const subscriptions = await prisma.subscription.findMany({
      where: {
        OR: userCourseIds.map(({ userId, courseId }) => ({
          userId,
          courseId,
          paid: true
        }))
      },
      select: {
        userId: true,
        courseId: true,
        actualAmountPaid: true,
        couponCode: true,
        paidAt: true
      },
      orderBy: { paidAt: 'desc' }
    });

    // ✅ OPTIMIZATION: Batch fetch all progress data in one query
    const progressData = await prisma.courseProgress.findMany({
      where: {
        OR: userCourseIds.map(({ userId, courseId }) => ({
          userId,
          courseId
        }))
      },
      select: {
        userId: true,
        courseId: true,
        completed: true,
        quizScore: true,
        totalQuizQuestions: true
      }
    });

    // ✅ Create lookup maps for O(1) access
    const subscriptionMap = new Map(
      subscriptions.map(s => [`${s.userId}-${s.courseId}`, s])
    );
    
    const progressMap = new Map<string, typeof progressData>();
    progressData.forEach(p => {
      const key = `${p.userId}-${p.courseId}`;
      if (!progressMap.has(key)) {
        progressMap.set(key, []);
      }
      progressMap.get(key)!.push(p);
    });

    // ✅ PERFORMANCE: Map data using lookups instead of individual queries
    const enrollmentsWithAmount = enrollments.map((enrollment) => {
      const key = `${enrollment.userId}-${enrollment.courseId}`;
      const subscription = subscriptionMap.get(key);
      const courseProgressData = progressMap.get(key) || [];
      const totalContents = enrollment.course._count.contents;

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
    });

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
