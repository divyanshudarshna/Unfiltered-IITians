const assert = require("node:assert/strict");
const Module = require("node:module");
require("tsx/cjs");
let signedIn = true;
let orderCalls = [];
let drafts = [];
let pendingEnrollment = null;
let courseHasActiveAccess = false;
const mock = { id: "included", price: 100, status: "PUBLISHED", billingMode: "ONE_TIME", subscriptionEnabled: false };
const bundle = { id: "bundle", status: "PUBLISHED", mockIds: ["included"], basePrice: 100, discountedPrice: 80, billingMode: "ONE_TIME" };
const session = { id: "session", status: "PUBLISHED", price: 500, discountedPrice: 399.99, billingMode: "ONE_TIME", expiryDate: null };
const prisma = {
  mockTest: { findUnique: async () => mock, findMany: async ({ where }) => { assert.deepEqual(where.id.in, ["included"]); assert.equal(where.status, "PUBLISHED"); return [mock]; } },
  mockBundle: { findUnique: async () => bundle },
  session: { findUnique: async () => session },
  sessionEnrollment: { findFirst: async ({ where }) => where.paymentStatus === "SUCCESS" ? null : pendingEnrollment, create: async ({ data }) => drafts.push(data), deleteMany: async () => { throw new Error("Pending payment must not be deleted"); } },
  subscription: { create: async ({ data }) => { drafts.push(data); return { id: "legacy" }; }, findFirst: async ({ where }) => {
    assert.equal(where.paid, true); assert.ok(where.OR.some(window => window.expiresAt?.gt instanceof Date));
    return courseHasActiveAccess ? { paid: true } : null;
  } },
  enrollment: { findFirst: async () => null }, entitlement: { findFirst: async () => null }, courseBillingSubscription: { findFirst: async () => null },
  course: { findUnique: async () => ({ id: "course", status: "PUBLISHED", price: 1000, durationMonths: 12 }) },
};
const originalLoad = Module._load;
Module._load = function (request) {
  if (request === "@/lib/prisma") return { prisma };
  if (request === "@/lib/roleAuth") return { getDbUserFromClerk: async () => signedIn ? { id: "owner", name: "Student", email: "student@example.com" } : null };
  if (request === "@/lib/razorpay") return { razorpay: { orders: {
    create: async input => { orderCalls.push(input); return { id: "order", ...input }; },
    fetch: async id => ({ id, amount: 39999, currency: "INR", status: "attempted" }),
  } } };
  return originalLoad.apply(this, arguments);
};
const { POST: order } = require("../app/api/payment/order/route.ts");
const { POST: oldCreate } = require("../app/api/subscription/create/route.ts");
const { POST: courseOrder } = require("../app/api/courses/[id]/razorpay/route.ts");
Module._load = originalLoad;
const req = body => new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
async function main() {
  assert.equal((await order(req({ itemType: "mockBundle", itemId: "bundle", amount: 1, mockIds: ["foreign"] }))).status, 201);
  assert.equal(orderCalls.at(-1).amount, 8000);
  assert.equal(drafts.at(-1).actualAmountPaid, 8000);
  assert.deepEqual(drafts.filter(draft => draft.mockTestId).map(draft => draft.mockTestId), ["included"]);
  assert.equal((await order(req({ itemType: "session", itemId: "session", amount: 1, studentPhone: "9999999999" }))).status, 201);
  assert.equal(orderCalls.at(-1).amount, 39999);
  pendingEnrollment = { razorpayOrderId: "previous", amountPaid: 399.99 };
  const beforeResume = orderCalls.length;
  assert.equal((await order(req({ itemType: "session", itemId: "session", studentPhone: "9999999999" }))).status, 200);
  assert.equal(orderCalls.length, beforeResume);
  signedIn = false;
  assert.equal((await oldCreate(req({ userId: "victim", mockTestId: "included" }))).status, 401);
  signedIn = true;
  assert.equal((await oldCreate(req({ userId: "victim", mockTestId: "included" }))).status, 200);
  assert.equal(drafts.at(-1).userId, "owner");
  assert.equal(drafts.at(-1).actualAmountPaid, 10000);
  assert.equal((await courseOrder(req({}), { params: Promise.resolve({ id: "course" }) })).status, 201);
  courseHasActiveAccess = true;
  assert.equal((await courseOrder(req({}), { params: Promise.resolve({ id: "course" }) })).status, 400);
  assert.equal((await order(req({ itemType: "unknown", itemId: "anything" }))).status, 400);
  console.log("legacy price tampering, bundle membership, identity, pending retry and expired-renewal tests passed");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
