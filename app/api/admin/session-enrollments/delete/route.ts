import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const SECURITY_PASSWORD = process.env.ADMIN_DELETE_PASSWORD || 'AdminDelete@2024';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { enrollmentId, securityPassword } = body;

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'Enrollment ID is required' },
        { status: 400 }
      );
    }

    if (securityPassword !== SECURITY_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid security password' },
        { status: 403 }
      );
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
