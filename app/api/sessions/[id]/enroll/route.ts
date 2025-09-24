import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check if session exists and is published
    const session = await prisma.session.findUnique({
      where: { id: params.id }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Session is not available' }, { status: 400 });
    }

    // Check if session has expired
    if (session.expiryDate && new Date() > session.expiryDate) {
      return NextResponse.json({ error: 'Session has expired' }, { status: 400 });
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.sessionEnrollment.findUnique({
      where: {
        sessionId_userId: {
          sessionId: params.id,
          userId: user.id
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this session' },
        { status: 400 }
      );
    }

    // Check enrollment limit
    if (session.maxEnrollment) {
      const currentEnrollments = await prisma.sessionEnrollment.count({
        where: { 
          sessionId: params.id,
          paymentStatus: 'SUCCESS'
        }
      });

      if (currentEnrollments >= session.maxEnrollment) {
        return NextResponse.json(
          { error: 'Session is full' },
          { status: 400 }
        );
      }
    }

    // Create enrollment record
    const enrollment = await prisma.sessionEnrollment.create({
      data: {
        sessionId: params.id,
        userId: user.id,
        studentName: user.name || '',
        studentEmail: user.email,
        studentPhone: phoneNumber,
        paymentStatus: 'PENDING',
        amountPaid: session.discountedPrice || session.price
      }
    });

    return NextResponse.json({
      enrollmentId: enrollment.id,
      session: {
        title: session.title,
        price: session.discountedPrice || session.price
      },
      user: {
        name: user.name,
        email: user.email,
        phone: phoneNumber
      }
    });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}