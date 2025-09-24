import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const where = status ? { status } : {};

    const sessions = await prisma.session.findMany({
      where,
      include: {
        _count: {
          select: {
            enrollments: {
              where: { paymentStatus: 'SUCCESS' }
            }
          }
        },
        enrollments: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { enrolledAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.session.count({ where });

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    
    const session = await prisma.session.create({
      data: {
        title: body.title,
        description: body.description,
        content: body.content,
        tags: body.tags || [],
        status: body.status || 'DRAFT',
        price: parseFloat(body.price) || 0,
        discountedPrice: body.discountedPrice ? parseFloat(body.discountedPrice) : null,
        maxEnrollment: body.maxEnrollment ? parseInt(body.maxEnrollment) : null,
        type: body.type,
        duration: parseInt(body.duration),
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      },
      include: {
        _count: {
          select: { enrollments: true }
        }
      }
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}