import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { adminAuth } from '@/lib/adminAuth';

// GET /api/admin/users/search?q=<query> - search users by name or email
export async function GET(request: NextRequest) {
  try {
    await adminAuth();

    const q = request.nextUrl.searchParams.get('q') || '';

    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        profileImageUrl: true,
      },
      take: 10,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    return NextResponse.json(
      { error: err.message || 'Failed to search users' },
      { status: err.status || 500 }
    );
  }
}
