const assert = require("node:assert/strict");
const Module = require("node:module");
require("tsx/cjs");
process.env.CRON_SECRET = "cron-test";
let provider = { id: "sub_1", status: "created", paid_count: 0 };
let cancelled = [];
let closed = [];
let synchronized = [];
let discovered;
let recovered = [];
let authorized = true;
const subscription = { id: "local_1", userId: "user_1", razorpaySubscriptionId: "sub_1", originCheckoutId: "checkout_1", providerStatus: "CREATED", cancelAtPeriodEnd: false };
const prisma = {
  courseBillingSubscription: { findFirst: async () => subscription, updateMany: async (query) => { synchronized.push(query); return { count: 1 }; }, findMany: async (query) => query.take ? [{ originCheckoutId: "paid_renewal" }] : [] },
  commerceBillingSubscription: { findFirst: async () => null, findMany: async () => [], updateMany: async () => ({ count: 1 }) },
  sessionEnrollment: { findMany: async () => [] },
  commerceSubscriptionSlot: {
    findMany: async () => { throw new Error("Cleanup must not discover checkouts through slots"); },
    deleteMany: async () => ({ count: 0 }),
  },
  commerceCheckout: {
    findMany: async (query) => { discovered = query; return [{ id: "orphan_course", checkoutType: "COURSE_RECURRING" }, { id: "orphan_bundle", checkoutType: "RECURRING" }, { id: "paid_renewal", checkoutType: "COURSE_RECURRING", status: "PAID" }]; },
    updateMany: async () => ({ count: 1 }),
  },
};
const original = Module._load;
Module._load = function (request) {
  const normalized = request.replaceAll("\\", "/");
  if (normalized.endsWith("lib/prisma")) return { prisma };
  if (normalized.endsWith("lib/roleAuth")) return { getDbUserFromClerk: async () => authorized ? { id: "user_1" } : null };
  if (normalized.endsWith("lib/billing-reconciliation")) return {
    closeUnpaidCheckout: async (id) => { closed.push(id); },
    reconcileCheckout: async (checkout) => { recovered.push(checkout.id); return { action: checkout.status === "PAID" ? "FULFILL" : "CANCEL_LOCAL" }; },
  };
  if (normalized.endsWith("lib/razorpay")) return { assertRazorpayServerConfiguration() {}, razorpay: { subscriptions: {
    fetch: async () => provider,
    cancel: async (id, cycleEnd) => { cancelled.push({ id, cycleEnd }); return { ...provider, status: cycleEnd ? "active" : "cancelled" }; },
  } } };
  return original.apply(this, arguments);
};
const cancellation = require("../app/api/billing/subscriptions/[id]/cancel/route.ts");
const cron = require("../app/api/internal/billing/release-expired-session-seats/route.ts");
Module._load = original;
const params = { params: Promise.resolve({ id: subscription.id }) };
const request = new Request("http://localhost/cancel", { method: "POST" });
async function main() {
  let response = await cancellation.POST(request, params);
  assert.equal(response.status, 200);
  assert.equal(cancelled[0].cycleEnd, false);
  assert.deepEqual(closed, ["checkout_1"]);
  assert.equal(synchronized[0].data.providerStatus, "CANCELLED");
  const seconds = Math.floor(Date.now() / 1000);
  provider = { ...provider, status: "active", paid_count: 1, current_start: seconds - 10, current_end: seconds + 3600 };
  response = await cancellation.POST(request, params);
  assert.equal((await response.json()).cancelAtPeriodEnd, true);
  assert.equal(cancelled[1].cycleEnd, true);
  assert.equal(closed.length, 1);
  subscription.cancelAtPeriodEnd = true;
  await cancellation.POST(request, params);
  assert.equal(cancelled.length, 2);
  subscription.cancelAtPeriodEnd = false;
  provider = { ...provider, status: "expired", paid_count: 0 };
  await cancellation.POST(request, params);
  assert.equal(cancelled.length, 2);
  assert.equal(closed.length, 2);
  authorized = false;
  assert.equal((await cancellation.POST(request, params)).status, 401);
  assert.equal((await cron.GET(new Request("http://localhost/cron"))).status, 401);
  response = await cron.GET(new Request("http://localhost/cron", { headers: { authorization: "Bearer cron-test" } }));
  assert.equal(response.status, 200);
  assert.deepEqual(recovered, ["orphan_course", "orphan_bundle", "paid_renewal"]);
  assert.deepEqual(discovered.where.OR[1], { status: "PAID", id: { in: ["paid_renewal"] } });
  assert.equal(discovered.where.productType, undefined);
  assert.equal(discovered.where.id, undefined);
  assert.equal((await response.json()).cancelledCheckouts, 2);
  console.log("unpaid/paid/expired cancellation and orphan/generic cron discovery tests passed");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
