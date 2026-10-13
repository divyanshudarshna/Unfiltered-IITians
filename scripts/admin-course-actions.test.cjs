const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
require('tsx/cjs');
const NOW = new Date('2026-10-13T12:00:00Z');
const ids = { user: '111111111111111111111111', course: '222222222222222222222222', checkout: '333333333333333333333333', payment: '444444444444444444444444' };
let state;
let providerCalls;
let failCancel = false;
let loseRefundResponse = false;
let refundsIssued;
let paymentOverrides, refundResponseStatus, failLocalTransaction;
function reset() {
  failCancel = false;
  loseRefundResponse = false;
  providerCalls = [];
  refundsIssued = new Map();
  paymentOverrides = {}; refundResponseStatus = 'processed'; failLocalTransaction = false;
  state = {
    user: [{ id: ids.user, name: 'Student', email: 'student@example.com' }],
    course: [{ id: ids.course, title: 'Combo course' }],
    enrollment: [{ id: 'enrollment', userId: ids.user, courseId: ids.course, expiresAt: new Date('2026-11-13') }],
    commerceCheckout: [{ id: ids.checkout, userId: ids.user, productType: 'COURSE', productId: ids.course, status: 'PAID', checkoutType: 'COURSE_RECURRING', razorpaySubscriptionId: 'sub_owned', snapshot: {} }],
    courseBillingSubscription: [{ id: 'subscription', userId: ids.user, courseId: ids.course, originCheckoutId: ids.checkout, razorpaySubscriptionId: 'sub_owned', providerStatus: 'ACTIVE', billingPlan: { razorpayPlanId: 'plan_owned' } }],
    commercePayment: [{ id: ids.payment, checkoutId: ids.checkout, providerPaymentId: 'pay_owned', providerOrderId: 'order_owned', providerSubscriptionId: 'sub_owned', amountPaise: 59900, currency: 'INR', status: 'CAPTURED', providerCapturedAt: new Date('2026-10-12T14:09:56Z') }],
    entitlement: [
      { id: 'course-access', userId: ids.user, resourceType: 'COURSE', resourceId: ids.course, sourceType: 'RAZORPAY_SUBSCRIPTION', sourceId: 'subscription', status: 'ACTIVE' },
      { id: 'included-mock', userId: ids.user, resourceType: 'MOCK_TEST', resourceId: 'mock', sourceType: 'RAZORPAY_SUBSCRIPTION', sourceId: 'subscription', status: 'ACTIVE' },
      { id: 'independent-mock', userId: ids.user, resourceType: 'MOCK_TEST', resourceId: 'mock', sourceType: 'RAZORPAY_PAYMENT', sourceId: 'pay_independent', status: 'ACTIVE' },
    ],
    subscription: [], sessionEnrollment: [], sessionSeatHold: [], commerceSubscriptionSlot: [], billingOutbox: [], commerceRefund: [],
  };
}
function matches(row, where = {}) {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'OR') return value.some(item => matches(row, item));
    if (key === 'AND') return value.every(item => matches(row, item));
    if (key === 'NOT') return !matches(row, value);
    const actual = row[key];
    if (value === null) return actual == null;
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if ('in' in value) return value.in.includes(actual);
      if ('notIn' in value) return !value.notIn.includes(actual);
      if ('startsWith' in value) return typeof actual === 'string' && actual.startsWith(value.startsWith);
      if ('gt' in value) return actual > value.gt;
      if ('lte' in value) return actual <= value.lte;
      if ('not' in value) return actual !== value.not;
    }
    return actual === value;
  });
}
let writes = 0;
const db = {};
for (const table of ['user', 'course', 'enrollment', 'commerceCheckout', 'courseBillingSubscription', 'commercePayment', 'entitlement', 'subscription', 'sessionEnrollment', 'sessionSeatHold', 'commerceSubscriptionSlot', 'billingOutbox', 'commerceRefund']) {
  db[table] = {
    findMany: async ({ where } = {}) => structuredClone(state[table].filter(row => matches(row, where))),
    findFirst: async ({ where } = {}) => structuredClone(state[table].find(row => matches(row, where)) ?? null),
    findUnique: async ({ where }) => structuredClone(state[table].find(row => matches(row, where)) ?? null),
    create: async ({ data }) => {
      if (table === 'billingOutbox' && state[table].some(row => row.dedupeKey === data.dedupeKey)) throw Object.assign(new Error('duplicate'), { code: 'P2002' });
      writes++;
      const row = { id: `${table}-${state[table].length}`, createdAt: NOW, ...structuredClone(data) };
      state[table].push(row);
      return structuredClone(row);
    },
    update: async ({ where, data }) => {
      const row = state[table].find(row => matches(row, where));
      assert.ok(row, `${table} update target exists`);
      writes++; Object.assign(row, structuredClone(data)); return structuredClone(row);
    },
    updateMany: async ({ where, data }) => {
      writes++;
      const rows = state[table].filter(row => matches(row, where));
      rows.forEach(row => Object.assign(row, structuredClone(data)));
      return { count: rows.length };
    },
    deleteMany: async ({ where }) => { writes++; const rows = state[table].filter(row => matches(row, where)); state[table] = state[table].filter(row => !matches(row, where)); return { count: rows.length }; },
    upsert: async ({ where, create, update }) => state[table].some(row => matches(row, where))
      ? db[table].update({ where, data: update }) : db[table].create({ data: create }),
  };
}
db.$transaction = async (callback) => {
  const snapshot = structuredClone(state);
  try { const result = await callback(db); if (failLocalTransaction) { failLocalTransaction = false; throw new Error('commit failed'); } return result; } catch (error) { state = snapshot; throw error; }
};
async function provider(method, url, body, key) {
  providerCalls.push({ method, url, body, key });
  if (url === '/subscriptions/sub_owned' && method === 'GET') return { id: 'sub_owned', plan_id: 'plan_owned', status: failCancel ? 'active' : providerCalls.some(call => call.url.endsWith('/cancel') && call.method === 'POST') ? 'cancelled' : 'active' };
  if (url === '/subscriptions/sub_owned/cancel') {
    assert.equal(body.cancel_at_cycle_end, 0, 'Admin termination cancels immediately');
    if (failCancel) throw new Error('provider temporarily unavailable');
    return { id: 'sub_owned', status: 'cancelled' };
  }
  if (url === '/payments/pay_owned' && method === 'GET') return { id: 'pay_owned', order_id: 'order_owned', invoice_id: 'inv_owned', amount: 59900, currency: 'INR', status: refundsIssued.size && refundResponseStatus === 'processed' ? 'refunded' : 'captured', amount_refunded: refundsIssued.size ? 59900 : 0, created_at: 1791814196, ...paymentOverrides };
  if (url === '/invoices/inv_owned') return { id: 'inv_owned', subscription_id: 'sub_owned', payment_id: 'pay_owned', order_id: 'order_owned', status: 'paid', amount_paid: 59900, currency: 'INR', paid_at: Math.floor(state.commercePayment[0].providerCapturedAt.getTime() / 1000) };
  if (url === '/payments/pay_owned/refund') {
    assert.ok(key && /^[A-Za-z0-9_-]{10,}$/.test(key));
    assert.equal(body.amount, 59900);
    if (!refundsIssued.has(key)) refundsIssued.set(key, { id: 'rfnd_owned', payment_id: 'pay_owned', amount: 59900, currency: 'INR', status: refundResponseStatus });
    if (loseRefundResponse) { loseRefundResponse = false; throw new Error('response lost after refund'); }
    return refundsIssued.get(key);
  }
  throw new Error(`Unexpected provider request ${method} ${url}`);
}
const originalLoad = Module._load;
Module._load = function (request, parent) {
  const resolved = (request.startsWith('.') ? path.resolve(path.dirname(parent.filename), request) : request).replaceAll('\\', '/');
  if (resolved.endsWith('lib/prisma') || resolved.endsWith('lib/prisma.ts')) return { prisma: db };
  if (resolved.endsWith('lib/razorpay-admin') || resolved.endsWith('lib/razorpay-admin.ts')) return { razorpayAdminRequest: provider };
  if (resolved.endsWith('lib/session-seat-inventory') || resolved.endsWith('lib/session-seat-inventory.ts')) return { releaseSessionSeatHold: async () => {}, releaseConfirmedSessionSeat: async () => {} };
  return originalLoad.apply(this, arguments);
};
const { executeAdminCourseAction, getAdminCourseBilling } = require('../lib/admin-course-actions.ts');
Module._load = originalLoad;
const input = { userId: ids.user, courseId: ids.course, actorId: 'admin', action: 'TERMINATE_REFUND', paymentId: 'pay_owned', reason: 'Customer requested refund', requestId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' };
async function main() {
  reset(); writes = 0;
  const details = await getAdminCourseBilling(ids.user, ids.course, NOW);
  assert.equal(details.payments[0].refundEligible, true);
  const done = await executeAdminCourseAction(input, NOW);
  assert.equal(done.pending, false);
  assert.equal(done.refundStatus, 'PROCESSED');
  assert.equal(state.commerceCheckout[0].status, 'CANCELLED');
  assert.ok(state.enrollment[0].expiresAt < NOW);
  assert.equal(state.entitlement.find(row => row.id === 'course-access').status, 'REVOKED');
  assert.equal(state.entitlement.find(row => row.id === 'included-mock').status, 'REVOKED');
  assert.equal(state.entitlement.find(row => row.id === 'independent-mock').status, 'ACTIVE');
  assert.equal(state.commercePayment[0].status, 'REFUNDED');
  assert.equal(state.commerceRefund.length, 1);
  const mutations = providerCalls.filter(call => call.method === 'POST').length;
  await executeAdminCourseAction(input, NOW);
  assert.equal(providerCalls.filter(call => call.method === 'POST').length, mutations, 'Repeated confirmed action is idempotent');

  reset(); writes = 0;
  state.commercePayment[0].providerCapturedAt = new Date(NOW.getTime() - 7 * 86400000 - 1000);
  await assert.rejects(executeAdminCourseAction(input, NOW), /7.day/i);
  assert.equal(writes, 0, 'Expired refund must not terminate access or create a job');
  assert.equal(providerCalls.filter(call => call.method === 'POST').length, 0);
  const terminate = await executeAdminCourseAction({ ...input, action: 'TERMINATE', paymentId: undefined }, NOW);
  assert.equal(terminate.pending, false);
  assert.equal(refundsIssued.size, 0, 'Termination without refund is allowed outside the refund window');
  assert.equal(state.commercePayment[0].status, 'CAPTURED', 'Termination preserves payment history');

  reset(); writes = 0;
  await assert.rejects(executeAdminCourseAction({ ...input, paymentId: 'pay_foreign' }, NOW), /payment/i);
  assert.equal(writes, 0);
  reset(); writes = 0;
  failCancel = true;
  const pending = await executeAdminCourseAction(input, NOW);
  assert.equal(pending.pending, true);
  assert.equal(refundsIssued.size, 0, 'Do not refund until future billing is confirmed stopped');
  assert.equal(state.entitlement[0].status, 'REVOKED', 'Provider failure cannot restore terminated access');
  const resumable = await getAdminCourseBilling(ids.user, ids.course, NOW, 'admin');
  assert.equal(resumable.pendingAction.requestId, input.requestId, 'A fresh browser must recover the original pending admin action from the server');
  failCancel = false;
  const resumed = await executeAdminCourseAction(input, NOW);
  assert.equal(resumed.pending, false);
  assert.equal(refundsIssued.size, 1);

  reset(); loseRefundResponse = true;
  assert.equal((await executeAdminCourseAction(input, NOW)).pending, true);
  assert.equal(refundsIssued.size, 1);
  const retry = await executeAdminCourseAction(input, NOW);
  assert.equal(retry.pending, false);
  assert.equal(refundsIssued.size, 1, 'Uncertain provider response retries the exact idempotent refund');
  const refunds = providerCalls.filter(call => call.url.endsWith('/refund'));
  assert.equal(refunds.length, 2);
  assert.equal(refunds[0].key, refunds[1].key);
  assert.deepEqual(refunds[0].body, refunds[1].body);

  reset(); state.enrollment = []; // Paid but access never granted, like the affected customer.
  assert.equal((await executeAdminCourseAction(input, NOW)).pending, false);
  reset(); state.commercePayment[0].providerCapturedAt = new Date(NOW.getTime() - 7 * 86400000);
  assert.equal((await executeAdminCourseAction(input, NOW)).pending, false, 'Exact seven-day boundary is eligible');

  reset(); writes = 0; paymentOverrides.amount_refunded = 100;
  await assert.rejects(executeAdminCourseAction(input, NOW), /partial refund/i);
  assert.equal(writes, 0); assert.equal(refundsIssued.size, 0);
  reset(); writes = 0; state.commercePayment[0].status = 'REFUNDED';
  await assert.rejects(executeAdminCourseAction(input, NOW), /captured/i);
  assert.equal(writes, 0);
  reset(); refundResponseStatus = 'pending';
  const accepted = await executeAdminCourseAction(input, NOW);
  assert.equal(accepted.pending, false, 'The request is accepted, not an uncertain network outcome');
  assert.equal(accepted.refundStatus, 'CREATED', 'Accepted refund must not be reported as processed');
  assert.equal(state.commercePayment[0].status, 'CAPTURED');
  reset(); failLocalTransaction = true;
  const rolledBack = await executeAdminCourseAction(input, NOW);
  assert.equal(rolledBack.pending, true); assert.equal(rolledBack.accessTerminated, false);
  assert.equal(state.entitlement[0].status, 'ACTIVE', 'A failed local commit cannot claim revoked access');
  assert.equal(refundsIssued.size, 0);
  assert.equal((await executeAdminCourseAction(input, NOW)).pending, false);
  console.log('admin termination, 7-day refunds, ownership, history preservation and safe retries tests passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
