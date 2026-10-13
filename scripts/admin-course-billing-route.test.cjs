const assert = require('node:assert/strict');
const Module = require('node:module');
require('tsx/cjs');
let signedIn = true, role = 'ADMIN', calls = 0;
let rejectAction = false, operationExists = false;
const reviewRows = ['REQUIRES_REVIEW', 'CANCELLED', 'CANCELLED'].map((status, index) => ({ id: `checkout_${index}`, status, productId: '222222222222222222222222', user: { id: '111111111111111111111111', email: 'student@example.com' }, amountPaise: 59900, currency: 'INR' }));
class ActionError extends Error { constructor(message, status) { super(message); this.status = status; } }
const original = Module._load;
Module._load = function (request) {
  if (request === '@clerk/nextjs/server') return { auth: async () => ({ userId: signedIn ? 'clerk_admin' : null }) };
  if (request === '@/lib/prisma') return { prisma: { user: { findUnique: async () => ({ id: 'admin', role }) },
    commerceCheckout: { findMany: async () => reviewRows }, commercePayment: { findMany: async () => reviewRows.map(row => ({ checkoutId: row.id, status: row.id === 'checkout_1' ? 'REFUNDED' : 'CAPTURED' })) },
    billingOutbox: { findUnique: async () => operationExists ? { id: 'operation' } : null, findMany: async () => [{ payload: { scope: { checkoutIds: ['checkout_1'] } } }] } } };
  if (request === '@/lib/admin-course-actions') return {
    AdminCourseActionError: ActionError,
    getAdminCourseBilling: async () => { calls++; return { payments: [] }; },
    executeAdminCourseAction: async input => { calls++; assert.equal(input.actorId, 'admin'); if (rejectAction) throw new ActionError('Outside refund window', 409); return { pending: true }; },
  };
  return original.apply(this, arguments);
};
const { GET, POST } = require('../app/api/admin/enrollments/billing/route.ts');
Module._load = original;
const { NextRequest } = require('next/server');
const body = { userId: '111111111111111111111111', courseId: '222222222222222222222222', requestId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', action: 'TERMINATE_REFUND', paymentId: 'pay_owned', reason: 'Customer requested refund', confirmation: 'TERMINATE' };
const req = (data = body, origin = 'https://example.com') => new NextRequest('https://example.com/api/admin/enrollments/billing', { method: 'POST', headers: { 'Content-Type': 'application/json', origin }, body: JSON.stringify(data) });
async function main() {
  signedIn = false; assert.equal((await POST(req())).status, 401);
  signedIn = true; role = 'MODERATOR'; assert.equal((await POST(req())).status, 403);
  role = 'ADMIN'; assert.equal((await POST(req(body, 'https://evil.example'))).status, 403);
  assert.equal((await POST(req({ ...body, confirmation: '' }))).status, 400);
  assert.equal((await POST(req({ ...body, requestId: 'new' }))).status, 400);
  assert.equal(calls, 0);
  assert.equal((await POST(req())).status, 202, 'Unconfirmed financial outcome must remain pending');
  rejectAction = true;
  assert.equal((await (await POST(req())).json()).retryRequired, false, 'A preflight rejection with no operation allows changing to termination only');
  operationExists = true;
  assert.equal((await (await POST(req())).json()).retryRequired, true, 'A started operation must keep its original request on errors');
  rejectAction = false;
  const reviews = await (await GET(new NextRequest(`https://example.com/api/admin/enrollments/billing?courseId=${body.courseId}&reviews=true`))).json();
  assert.deepEqual(reviews.checkouts.map(row => row.id), ['checkout_0', 'checkout_1'], 'Pending operations remain discoverable after revocation/refund; completed cancellations do not clutter the review list');
  assert.equal((await GET(new NextRequest(`https://example.com/api/admin/enrollments/billing?courseId=${body.courseId}&userId=${body.userId}`))).status, 200);
  role = 'STUDENT'; assert.equal((await GET(new NextRequest(`https://example.com/api/admin/enrollments/billing?courseId=${body.courseId}&userId=${body.userId}`))).status, 403);
  console.log('Admin billing authorization, confirmation, origin, validation and pending-response tests passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
