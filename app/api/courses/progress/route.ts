import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { ObjectId } from 'mongodb';

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

    const whereClause: any = { userId: mongoUserId, courseId };
    if (contentId) whereClause.contentId = contentId;

    const progress = await prisma.courseProgress.findMany({
      where: whereClause,
      include: {
        content: { select: { title: true, order: true } },
      },
      orderBy: { content: { order: 'asc' } },
    });

    return NextResponse.json(progress);
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
    const { courseId, contentId, completed, progress, quizScore, totalQuizQuestions, attemptedQuestions } = body;

    if (!courseId || !contentId) {
      return NextResponse.json({ error: 'Course ID and Content ID are required' }, { status: 400 });
    }

    // ✅ Validate ObjectId format
    if (!ObjectId.isValid(courseId) || !ObjectId.isValid(contentId)) {
      return NextResponse.json({ error: 'Invalid courseId or contentId' }, { status: 400 });
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
        completed,
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
        completed,
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
