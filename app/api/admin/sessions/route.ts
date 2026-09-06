import { NextRequest, NextResponse } from 'next/server';
import { type Prisma, type SessionStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getSessionExpiryDate } from '@/lib/guidance-session-expiry';
import { assertAdminApiAccess, handleAuthError } from '@/lib/roleAuth';
import { CommerceBillingInputError, normalizeCommerceBillingInput } from '@/lib/commerce-billing';
import { createOrVersionCommerceBillingPlan } from '@/lib/commerce-billing-plan';

export async function GET(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, req.method, 'courses');

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const where: Prisma.SessionWhereInput = status ? { status: status as SessionStatus } : {};

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
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.session.count({ where });
    const plans = await prisma.commerceBillingPlan.findMany({
      where: { productType: 'GUIDANCE_SESSION', productId: { in: sessions.map((session) => session.id) } },
      orderBy: { version: 'desc' },
    });
    const plansBySession = new Map<string, typeof plans>();
    for (const plan of plans) {
      const current = plansBySession.get(plan.productId) ?? [];
      current.push(plan);
      plansBySession.set(plan.productId, current);
    }

    return NextResponse.json({
      sessions: sessions.map((session) => ({ ...session, billingPlans: plansBySession.get(session.id) ?? [] })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, req.method, 'courses');

    const body = await req.json();
    const billing = normalizeCommerceBillingInput(body);
    if (billing.subscriptionEnabled && body.expiryDate) {
      return NextResponse.json({ error: 'Recurring guidance programs cannot have a fixed expiry date' }, { status: 400 });
    }
    
    const session = await prisma.$transaction(async (tx) => {
      const created = await tx.session.create({
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
        expiryDate: getSessionExpiryDate(body.expiryDate),
          billingMode: billing.billingMode,
          subscriptionEnabled: billing.subscriptionEnabled,
        },
      });
      await createOrVersionCommerceBillingPlan(tx, {
        productType: 'GUIDANCE_SESSION',
        productId: created.id,
        billing,
      });
      return tx.session.findUniqueOrThrow({
        where: { id: created.id },
        include: {
        _count: {
          select: { enrollments: true }
        }
        }
      });
    });

    return NextResponse.json(session);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    if (error instanceof CommerceBillingInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
