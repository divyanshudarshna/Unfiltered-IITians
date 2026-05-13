import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { adminAuth } from '@/lib/adminAuth';
import { randomBytes } from 'crypto';

function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const random = randomBytes(4).toString('hex').toUpperCase();
  return `UNF-${year}-${random}`;
}

// GET /api/admin/certificates/custom - list all custom certs
export async function GET(request: NextRequest) {
  try {
    await adminAuth();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { recipientName: { contains: search, mode: 'insensitive' } },
        { recipientEmail: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
        { certificateId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [certificates, total] = await Promise.all([
      prisma.customCertificate.findMany({
        where,
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.customCertificate.count({ where }),
    ]);

    // Stats
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalAll, todayCount, monthCount] = await Promise.all([
      prisma.customCertificate.count(),
      prisma.customCertificate.count({ where: { issuedAt: { gte: startOfToday } } }),
      prisma.customCertificate.count({ where: { issuedAt: { gte: startOfMonth } } }),
    ]);

    return NextResponse.json({
      certificates,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: { total: totalAll, today: todayCount, thisMonth: monthCount },
    });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    return NextResponse.json(
      { error: err.message || 'Failed to fetch certificates' },
      { status: err.status || 500 }
    );
  }
}

// POST /api/admin/certificates/custom - create a custom certificate
export async function POST(request: NextRequest) {
  try {
    const admin = await adminAuth();
    const body = await request.json();
    const { recipientName, recipientEmail, purpose, completionDate, startDate, userId } = body;

    if (!recipientName || !recipientEmail || !purpose || !completionDate) {
      return NextResponse.json(
        { error: 'recipientName, recipientEmail, purpose, and completionDate are required' },
        { status: 400 }
      );
    }

    const certificateId = generateCertificateId();

    const certificate = await prisma.customCertificate.create({
      data: {
        certificateId,
        recipientName,
        recipientEmail,
        purpose,
        startDate: startDate ? new Date(startDate) : null,
        completionDate: new Date(completionDate),
        generatedBy: admin.name || admin.email,
        ...(userId ? { userId } : {}),
      },
    });

    return NextResponse.json({ certificate }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    return NextResponse.json(
      { error: err.message || 'Failed to create certificate' },
      { status: err.status || 500 }
    );
  }
}
