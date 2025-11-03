// app/api/courses/[id]/public-coupons/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        courseId: params.id,
        isPublic: true,
        validTill: { gt: now },
      },
      orderBy: { validTill: 'asc' },
      select: {
        id: true,
        code: true,
        discountPct: true,
        validTill: true,
        usageCount: true,
        isPublic: true,
      },
    });

    return NextResponse.json(coupons);
  } catch (err) {
    console.error('❌ Get public coupons error:', err);
    return NextResponse.json({ error: 'Failed to fetch public coupons' }, { status: 500 });
  }
}
