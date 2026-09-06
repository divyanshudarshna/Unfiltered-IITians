import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionExpiryDate } from '@/lib/guidance-session-expiry';
import { assertAdminApiAccess, handleAuthError } from '@/lib/roleAuth';
import {
  CommerceBillingInputError,
  hasCommerceBillingInput,
  normalizeCommerceBillingInput,
  type CommerceBillingConfig,
} from '@/lib/commerce-billing';
import { createOrVersionCommerceBillingPlan } from '@/lib/commerce-billing-plan';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await assertAdminApiAccess(req.url, req.method, 'courses');
    const { id } = await params;

    const session = await prisma.session.findUnique({
      where: { id },
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
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await assertAdminApiAccess(req.url, req.method, 'courses');
    const { id } = await params;

    const body = await req.json();
    const hasBillingInput = hasCommerceBillingInput(body);
    const existing = await prisma.session.findUniqueOrThrow({ where: { id } });
    const latestPlan = existing.subscriptionEnabled
      ? await prisma.commerceBillingPlan.findFirst({
          where: { productType: 'GUIDANCE_SESSION', productId: id },
          orderBy: { version: 'desc' },
        })
      : null;
    const billing: CommerceBillingConfig = hasBillingInput
      ? normalizeCommerceBillingInput(body)
      : {
          billingMode: existing.billingMode,
          subscriptionEnabled: existing.subscriptionEnabled,
          amountPaise: latestPlan?.amountPaise ?? null,
          interval: 'monthly',
          totalCount: latestPlan?.totalCount ?? 120,
        };
    if (billing.subscriptionEnabled && body.expiryDate) {
      return NextResponse.json({ error: 'Recurring guidance programs cannot have a fixed expiry date' }, { status: 400 });
    }
    
    const session = await prisma.$transaction(async (tx) => {
      const updated = await tx.session.update({
        where: { id },
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
        expiryDate: getSessionExpiryDate(body.expiryDate),
          billingMode: billing.billingMode,
          subscriptionEnabled: billing.subscriptionEnabled,
        },
      });
      await createOrVersionCommerceBillingPlan(tx, {
        productType: 'GUIDANCE_SESSION',
        productId: updated.id,
        billing,
      });
      return tx.session.findUniqueOrThrow({
        where: { id: updated.id },
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
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await assertAdminApiAccess(req.url, req.method, 'courses');
    const { id } = await params;

    // Check if there are any enrollments
    const enrollments = await prisma.sessionEnrollment.count({
      where: { sessionId: id }
    });

    if (enrollments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete session with existing enrollments' },
        { status: 400 }
      );
    }

    await prisma.session.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Session deleted successfully' });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
