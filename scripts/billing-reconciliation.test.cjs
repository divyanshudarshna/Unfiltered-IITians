const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
require("tsx/cjs");
let writes = 0;
let events = [];
let providerError;
let providerStatus = "created";
let invoices = [];
let amount = 79900;
let stalled = false;
const checkout = { id: "checkout", userId: "owner", checkoutType: "COURSE_RECURRING", razorpaySubscriptionId: "sub_1", createdAt: new Date(), status: "PROVIDER_CREATED" };
const local = { id: "local", userId: "owner", originCheckoutId: "checkout", billingPlan: { razorpayPlanId: "plan_1", amountPaise: 79900, currency: "INR" } };
const updateMany = async () => { writes++; return { count: 1 }; };
const tx = {
  commerceCheckout: { updateMany },
  courseBillingSubscription: { updateMany }, commerceBillingSubscription: { updateMany },
  commerceSubscriptionSlot: { deleteMany: updateMany },
  generalCouponReservation: { findUnique: async () => null },
};
const mocks = {
  "lib/prisma": { prisma: { $transaction: async (fn) => fn(tx), courseBillingSubscription: { findUnique: async () => local, updateMany } } },
  "lib/razorpay": { assertRazorpayServerConfiguration() {}, razorpay: {
    subscriptions: { fetch: async () => { if (stalled) return new Promise(() => {}); if (providerError) throw providerError; return { id: "sub_1", plan_id: "plan_1", status: providerStatus, paid_count: invoices.length, current_start: 100, current_end: 300 }; } },
    invoices: { all: async () => ({ items: invoices }) },
    payments: { fetch: async () => ({ id: "pay_1", status: "captured", captured: true, amount, currency: "INR", order_id: "order_1", amount_refunded: 0 }) },
  } },
  "lib/razorpay-webhook-processor": { processRazorpayWebhookEvent: async (event) => { writes++; events.push(event); return { duplicate: false }; } },
  "lib/session-seat-inventory": { releaseSessionSeatHold: async () => { writes++; } },
};
const originalLoad = Module._load;
Module._load = function (request, parent) {
  const normalized = (request.startsWith(".") ? path.resolve(path.dirname(parent.filename), request) : request).replaceAll("\\", "/");
  for (const [suffix, mock] of Object.entries(mocks)) if (normalized.endsWith(suffix) || normalized.endsWith(suffix + ".ts")) return mock;
  return originalLoad.apply(this, arguments);
};
const { reconcileCheckout } = require("../lib/billing-reconciliation.ts");
Module._load = originalLoad;
async function main() {
  assert.equal((await reconcileCheckout(checkout, { dryRun: true })).action, "RESUME");
  providerStatus = "expired";
  assert.equal((await reconcileCheckout(checkout, { dryRun: true })).action, "CANCEL_LOCAL");
  assert.equal(writes, 0);
  await reconcileCheckout(checkout); // No slot lookup: orphaned records are repaired too.
  assert.ok(writes > 0);
  writes = 0;
  providerError = new Error("401 Unauthorized");
  await assert.rejects(reconcileCheckout(checkout));
  assert.equal(writes, 0);
  providerError = undefined;
  stalled = true;
  await assert.rejects(reconcileCheckout(checkout, { timeoutMs: 20 }));
  assert.equal(writes, 0);
  stalled = false;
  providerStatus = "active";
  invoices = [{ subscription_id: "sub_1", status: "paid", payment_id: "pay_1", order_id: "order_1", amount_paid: 79900, currency: "INR", paid_at: 200, billing_start: 100, billing_end: 300 }];
  assert.equal((await reconcileCheckout(checkout, { dryRun: true })).action, "FULFILL");
  assert.equal(writes, 0);
  amount = 1;
  await assert.rejects(reconcileCheckout(checkout));
  assert.equal(writes, 0);
  amount = 79900;
  await reconcileCheckout(checkout);
  assert.equal(events.length, 1);
  assert.equal(events[0].payload.created_at, 200);
  assert.equal(events[0].payload.payload.subscription.entity.current_end, 300);
  assert.ok(!events[0].eventId.includes("undefined"));
  console.log("billing reconciliation dry-run, provider verification and orphan recovery tests passed");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
