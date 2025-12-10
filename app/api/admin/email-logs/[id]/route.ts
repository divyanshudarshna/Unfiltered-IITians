import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const body = await request.json();
    const { password } = body;

    // Verify security password
    if (password !== process.env.ADMIN_DELETE_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid security password' },
        { status: 403 }
      );
    }

    // Delete email log
    await prisma.emailLog.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Email log deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting email log:', error);
    return NextResponse.json(
      { error: 'Failed to delete email log' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const emailLog = await prisma.emailLog.findUnique({
      where: { id },
    });

    if (!emailLog) {
      return NextResponse.json(
        { error: 'Email log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ emailLog });
  } catch (error) {
    console.error('Error fetching email log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email log' },
      { status: 500 }
    );
  }
}
