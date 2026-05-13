import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { adminAuth } from '@/lib/adminAuth';

// DELETE /api/admin/certificates/custom/[id] - delete with security password
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await adminAuth();
    const { id } = await context.params;
    const body = await request.json();
    const { password } = body;

    const securityPassword = process.env.SECURITY_PASSWORD;
    if (!securityPassword || password !== securityPassword) {
      return NextResponse.json({ error: 'Invalid security password' }, { status: 403 });
    }

    const existing = await prisma.customCertificate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    await prisma.customCertificate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    return NextResponse.json(
      { error: err.message || 'Failed to delete certificate' },
      { status: err.status || 500 }
    );
  }
}
