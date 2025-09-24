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

    const body = await req.json();
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = body;

    // Verify payment with Razorpay (you'll need to implement this)
    // const isValid = await verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    // For now, we'll assume payment is successful
    const isValid = true;

    if (isValid) {
      const enrollment = await prisma.sessionEnrollment.update({
        where: { id: params.id },
        data: {
          paymentStatus: 'SUCCESS',
          razorpayPaymentId,
          razorpayOrderId
        },
        include: {
          session: {
            select: { title: true }
          },
          user: {
            select: { name: true, email: true }
          }
        }
      });

      return NextResponse.json({
        success: true,
        enrollment,
        message: 'Payment verified successfully'
      });
    } else {
      await prisma.sessionEnrollment.update({
        where: { id: params.id },
        data: { paymentStatus: 'FAILED' }
      });

      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}