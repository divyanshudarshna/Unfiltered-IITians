const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
require("tsx/cjs");
let userId = "owner";
let signedIn = true;
const checkout = { id: "checkout", userId: "owner", checkoutType: "COURSE_RECURRING", productType: "COURSE", productId: "course", snapshot: { title: "Combo" }, discountPaise: 0 };
const subscription = { id: "subscription", userId: "owner", razorpaySubscriptionId: "sub_1", originCheckoutId: "checkout", currentPeriodEnd: new Date(Date.now() + 86400000), course: { title: "Combo" } };
const payments = [
  { id: "payment-old", checkoutId: null, providerSubscriptionId: "sub_1", providerPaymentId: "pay_old", amountPaise: 79900, currency: "INR", status: "CAPTURED", providerCapturedAt: new Date("2026-09-01") },
  { id: "payment-new", checkoutId: "checkout", providerSubscriptionId: "sub_1", providerPaymentId: "pay_new", amountPaise: 79900, currency: "INR", status: "CAPTURED", providerCapturedAt: new Date("2026-10-01") },
  { id: "foreign", checkoutId: "foreign-checkout", providerSubscriptionId: "foreign-sub", providerPaymentId: "foreign-payment", amountPaise: 1, status: "CAPTURED" },
];
const entitlements = [{ userId: "owner", resourceType: "COURSE", resourceId: "course", sourceType: "RAZORPAY_SUBSCRIPTION", sourceId: "subscription", startsAt: new Date(0), endsAt: subscription.currentPeriodEnd, status: "ACTIVE" }];
const prisma = {
  user: { findUnique: async () => ({ id: userId, name: "Student", email: "student@example.com" }) },
  commerceCheckout: { findMany: async ({ where }) => where.userId === "owner" ? [checkout] : [] },
  courseBillingSubscription: { findMany: async ({ where }) => where.userId === "owner" ? [subscription] : [] },
  commerceBillingSubscription: { findMany: async () => [] },
  entitlement: { findMany: async () => entitlements },
  commercePayment: { findMany: async ({ where }) => {
    assert.deepEqual(where.status.in, ["CAPTURED", "REFUNDED"]);
    return payments.filter(payment => (!where.id || where.id === payment.id) && (where.OR[0].checkoutId.in.includes(payment.checkoutId) || where.OR[1].providerSubscriptionId.in.includes(payment.providerSubscriptionId)));
  } },
  subscription: { findMany: async () => [], findFirst: async () => null },
  sessionEnrollment: { findMany: async () => [{ id: "projection", amountPaid: 799, razorpayPaymentId: "pay_new", session: { title: "Projection", type: "GROUP" }, enrolledAt: new Date() }], findFirst: async () => null },
};
const originalLoad = Module._load;
Module._load = function (request, parent) {
  const normalized = (request.startsWith(".") ? path.resolve(path.dirname(parent.filename), request) : request).replaceAll("\\", "/");
  if (normalized.endsWith("lib/prisma") || normalized.endsWith("lib/prisma.ts")) return { prisma };
  if (request === "@clerk/nextjs/server") return { currentUser: async () => signedIn ? { id: "clerk" } : null };
  return originalLoad.apply(this, arguments);
};
const { GET: history } = require("../app/api/billing/history/route.ts");
const { GET: receipt } = require("../app/api/billing/receipt/[id]/route.ts");
Module._load = originalLoad;
async function main() {
  const result = await (await history()).json();
  assert.equal(result.totalTransactions, 2);
  assert.equal(result.totalSpent, 1598); // Renewal charges count individually; session projection must not count twice.
  assert.deepEqual(result.billingHistory.map(item => item.paymentId), ["pay_new", "pay_old"]);
  assert.equal(result.billingHistory[1].actualAmountPaid, 799);
  assert.equal(result.billingHistory[0].isExpired, false);
  const response = await receipt(new Request("http://localhost"), { params: Promise.resolve({ id: "payment-old" }) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).receipt.itemTitle, "Combo"); // Older payment without checkoutId still resolves through owned subscription.
  payments[0].status = "REFUNDED";
  assert.equal((await (await history()).json()).totalSpent, 799);
  checkout.checkoutType = "ONE_TIME";
  payments[1].providerSubscriptionId = null;
  entitlements[0] = { ...entitlements[0], sourceType: "RAZORPAY_PAYMENT", sourceId: "pay_new", endsAt: new Date("2020-01-01") };
  const expired = (await (await history()).json()).billingHistory.find(row => row.paymentId === "pay_new");
  assert.equal(expired.isExpired, true);
  assert.equal(expired.expiresAt, "2020-01-01T00:00:00.000Z");
  entitlements.length = 0;
  const pending = (await (await history()).json()).billingHistory.find(row => row.paymentId === "pay_new");
  assert.equal(pending.accessPending, true);
  assert.equal(pending.isExpired, true, "Captured payments without fulfilled access must not appear active");
  userId = "different-user";
  assert.equal((await receipt(new Request("http://localhost"), { params: Promise.resolve({ id: "payment-old" }) })).status, 404);
  signedIn = false;
  assert.equal((await history()).status, 401);
  console.log("recurring history, ownership-safe receipts, legacy deduplication and refund tests passed");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
