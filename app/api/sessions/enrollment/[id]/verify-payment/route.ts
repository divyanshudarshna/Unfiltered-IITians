import { NextResponse } from 'next/server';

/**
 * This legacy endpoint could mark any session enrollment as paid without
 * verifying Razorpay. Fulfillment is being moved to the signed webhook
 * processor, so this route must remain disabled during the migration.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'This payment verification endpoint has been disabled',
      code: 'LEGACY_PAYMENT_VERIFICATION_DISABLED',
    },
    { status: 410 },
  );
}
