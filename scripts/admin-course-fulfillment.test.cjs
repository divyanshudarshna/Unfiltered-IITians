const assert = require('node:assert/strict');
const Module = require('node:module');
const crypto = require('node:crypto');
require('tsx/cjs');
let refunds = [{ externalKey: 'razorpay:refund:rfnd_1', providerRefundId: 'rfnd_1', providerPaymentId: 'pay_1', amountPaise: 59900, currency: 'INR', status: 'PROCESSED' }];
let hasPayment = true, subscriptionWrites = 0;
const db = {
  $transaction: async callback => callback(db),
  commercePayment: { findFirst: async () => hasPayment ? { id: 'payment', amountPaise: 59900 } : null, update: async () => {} },
  commerceRefund: {
    findUnique: async ({ where }) => refunds.find(row => row.externalKey === where.externalKey) ?? null,
    upsert: async ({ where, update, create }) => { const row = refunds.find(row => row.externalKey === where.externalKey); if (row) Object.assign(row, update); else refunds.push(create); },
  },
  razorpayWebhookEvent: { create: async () => {}, update: async () => {} },
  billingOutbox: { upsert: async () => {}, findUnique: async ({ where }) => where.dedupeKey === 'legacy-course-access-terminated:legacy_1' ? { id: 'termination' } : null },
  subscription: {
    findFirst: async () => ({ id: 'legacy_1', userId: 'owner', courseId: 'course', paid: false, actualAmountPaid: 59900, createdAt: new Date('2026-10-01'), expiresAt: new Date('2026-11-01') }),
    updateMany: async () => { subscriptionWrites++; return { count: 1 }; },
  },
};
const original = Module._load;
Module._load = function (request) {
  if (request === './prisma' || request === '@/lib/prisma') return { prisma: db };
  if (request === '@/lib/roleAuth') return { getDbUserFromClerk: async () => ({ id: 'owner' }) };
  if (request === '@/lib/email') return {};
  if (request === '@/lib/razorpay') return { assertRazorpayServerConfiguration: () => {}, razorpay: { payments: { fetch: async () => ({ order_id: 'order_1', status: 'captured', amount: 59900, currency: 'INR' }) } } };
  return original.apply(this, arguments);
};
const { processRazorpayWebhookEvent } = require('../lib/razorpay-webhook-processor.ts');
const { POST } = require('../app/api/courses/[id]/razorpay/verify/route.ts');
Module._load = original;
const event = type => ({ eventId: type, eventType: type, payloadHash: type, payload: { event: type, payload: { refund: { entity: { id: 'rfnd_1', payment_id: 'pay_1', amount: 59900, currency: 'INR' } } } } });
async function main() {
  await processRazorpayWebhookEvent(event('refund.created'));
  assert.equal(refunds[0].status, 'PROCESSED', 'Late created event cannot downgrade a processed admin refund');
  hasPayment = false; refunds[0].status = 'CREATED';
  const result = await processRazorpayWebhookEvent(event('refund.processed'));
  assert.equal(result.requiresReview, undefined, 'An already-recorded admin legacy refund must be acknowledged');
  assert.equal(refunds[0].status, 'PROCESSED');
  process.env.RAZORPAY_KEY_SECRET = 'test-only';
  const signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update('order_1|pay_1').digest('hex');
  const response = await POST(new Request('https://example.com', { method: 'POST', body: JSON.stringify({ razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: signature }) }));
  assert.notEqual(response.status, 200);
  assert.equal(subscriptionWrites, 0, 'A delayed legacy callback must never revive a terminated order');
  console.log('Admin refund ordering, legacy refund processing and legacy termination guard tests passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
