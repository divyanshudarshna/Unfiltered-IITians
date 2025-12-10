import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'enrolledAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      sessionId,
      ...(search && {
        user: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    // Get enrollments
    const [enrollments, total] = await Promise.all([
      prisma.sessionEnrollment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImageUrl: true,
            },
          },
          session: {
            select: {
              id: true,
              title: true,
              price: true,
              duration: true,
              expiryDate: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.sessionEnrollment.count({ where }),
    ]);

    return NextResponse.json({
      enrollments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching session enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session enrollments' },
      { status: 500 }
    );
  }
}
