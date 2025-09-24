import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const session = await prisma.session.findUnique({
      where: { id: params.id },
      include: {
        enrollments: {
          include: {
            user: {
              select: { name: true, email: true, phoneNumber: true }
            }
          },
          orderBy: { enrolledAt: 'desc' }
        },
        _count: {
          select: {
            enrollments: {
              where: { paymentStatus: 'SUCCESS' }
            }
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const session = await prisma.session.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        content: body.content,
        tags: body.tags || [],
        status: body.status,
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
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if there are any enrollments
    const enrollments = await prisma.sessionEnrollment.count({
      where: { sessionId: params.id }
    });

    if (enrollments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete session with existing enrollments' },
        { status: 400 }
      );
    }

    await prisma.session.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}