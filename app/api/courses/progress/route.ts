import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { ObjectId } from 'mongodb';
import { getCourseEntitlement } from '@/lib/courseAccess';

// Helper: map Clerk ID → Mongo ID
async function getMongoUserId(clerkUserId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });
  return user?.id || null;
}

// GET - Get user progress for a course
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const contentId = searchParams.get('contentId');

    if (!courseId) return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });

    const mongoUserId = await getMongoUserId(clerkUserId);
    if (!mongoUserId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const entitlement = await getCourseEntitlement(clerkUserId, courseId);
    if (!entitlement.hasFullAccess) {
      return NextResponse.json({ error: 'Active course access required' }, { status: 403 });
    }

    const courseProgressWhere = { userId: mongoUserId, courseId, ...(contentId ? { contentId } : {}) };
    const [contentProgress, lectureProgress] = await Promise.all([
      prisma.courseProgress.findMany({
        where: courseProgressWhere,
        include: {
          content: { select: { title: true, order: true } },
        },
        orderBy: { content: { order: 'asc' } },
      }),
      prisma.lectureProgress.findMany({
        where: courseProgressWhere,
        select: { lectureId: true, contentId: true, completed: true, lastAccessed: true },
        orderBy: { lastAccessed: 'desc' },
      }),
    ]);

    return NextResponse.json({ contentProgress, lectureProgress });
  } catch (error) {
    console.error('Error fetching course progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update user progress
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mongoUserId = await getMongoUserId(clerkUserId);
    if (!mongoUserId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await request.json();
    const { courseId, contentId, lectureId, completed, progress, quizScore, totalQuizQuestions, attemptedQuestions } = body;

    if (!courseId || !contentId) {
      return NextResponse.json({ error: 'Course ID and Content ID are required' }, { status: 400 });
    }

    // ✅ Validate ObjectId format
    if (!ObjectId.isValid(courseId) || !ObjectId.isValid(contentId) || (lectureId && !ObjectId.isValid(lectureId))) {
      return NextResponse.json({ error: 'Invalid courseId, contentId, or lectureId' }, { status: 400 });
    }

    const [entitlement, content] = await Promise.all([
      getCourseEntitlement(clerkUserId, courseId),
      prisma.content.findFirst({ where: { id: contentId, courseId }, select: { id: true, quiz: { select: { id: true } } } }),
    ]);
    if (!entitlement.hasFullAccess) {
      return NextResponse.json({ error: 'Active course access required' }, { status: 403 });
    }
    if (!content) {
      return NextResponse.json({ error: 'Content does not belong to this course' }, { status: 400 });
    }

    if (lectureId) {
      const lecture = await prisma.lecture.findFirst({
        where: { id: lectureId, contentId },
        select: { id: true },
      });
      if (!lecture) {
        return NextResponse.json({ error: 'Lecture does not belong to this content' }, { status: 400 });
      }

      const lectureProgress = await prisma.lectureProgress.upsert({
        where: {
          userId_courseId_lectureId: {
            userId: mongoUserId,
            courseId,
            lectureId,
          },
        },
        update: {
          completed: completed === true,
          lastAccessed: new Date(),
        },
        create: {
          userId: mongoUserId,
          courseId,
          contentId,
          lectureId,
          completed: completed === true,
        },
      });

      return NextResponse.json(lectureProgress);
    }

    if (!content.quiz) {
      return NextResponse.json({ error: 'Quiz progress requires a course module quiz' }, { status: 400 });
    }

    const courseProgress = await prisma.courseProgress.upsert({
      where: {
        userId_courseId_contentId: {
          userId: mongoUserId,
          courseId,
          contentId,
        },
      },
      update: {
        completed: completed === true,
        progress,
        quizScore,
        totalQuizQuestions,
        attemptedQuestions: attemptedQuestions ? JSON.stringify(attemptedQuestions) : undefined,
        lastAccessed: new Date(),
      },
      create: {
        userId: mongoUserId,
        courseId,
        contentId,
        completed: completed === true,
        progress,
        quizScore,
        totalQuizQuestions,
        attemptedQuestions: attemptedQuestions ? JSON.stringify(attemptedQuestions) : undefined,
      },
    });

    return NextResponse.json(courseProgress);
  } catch (error: any) {
    console.error('Error updating course progress:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Reset a module quiz attempt
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mongoUserId = await getMongoUserId(clerkUserId);
    if (!mongoUserId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { courseId, contentId } = await request.json();
    if (!courseId || !contentId || !ObjectId.isValid(courseId) || !ObjectId.isValid(contentId)) {
      return NextResponse.json({ error: 'Valid courseId and contentId are required' }, { status: 400 });
    }

    const [entitlement, content] = await Promise.all([
      getCourseEntitlement(clerkUserId, courseId),
      prisma.content.findFirst({ where: { id: contentId, courseId }, select: { id: true, quiz: { select: { id: true } } } }),
    ]);
    if (!entitlement.hasFullAccess) {
      return NextResponse.json({ error: 'Active course access required' }, { status: 403 });
    }
    if (!content?.quiz) {
      return NextResponse.json({ error: 'Quiz does not belong to this course module' }, { status: 400 });
    }

    await prisma.courseProgress.deleteMany({ where: { userId: mongoUserId, courseId, contentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting course quiz progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
