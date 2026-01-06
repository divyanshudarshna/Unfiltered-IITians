import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
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

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { enrollmentId, securityPassword } = body;

    if (!enrollmentId) {
      return NextResponse.json({ error: 'enrollmentId is required' }, { status: 400 });
    }

    if (!securityPassword) {
      return NextResponse.json({ error: 'Security password is required' }, { status: 400 });
    }

    // Verify security password
    const correctPassword = process.env.SECURITY_PASSWORD || 'RAJ64';
    if (securityPassword !== correctPassword) {
      return NextResponse.json({ error: 'Invalid security password' }, { status: 403 });
    }

    // Fetch enrollment to get user ID and session ID
    const enrollment = await prisma.sessionEnrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        userId: true,
        sessionId: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Delete the enrollment (no related subscriptions to delete for sessions)
    await prisma.sessionEnrollment.delete({
      where: { id: enrollmentId },
    });

    return NextResponse.json({
      success: true,
      message: 'Enrollment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to delete enrollment' },
      { status: 500 }
    );
  }
}
