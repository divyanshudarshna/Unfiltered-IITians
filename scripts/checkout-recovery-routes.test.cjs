const assert = require("node:assert/strict");
const Module = require("node:module");
require("tsx/cjs");
process.env.V2_CHECKOUT_ENABLED = "true";
process.env.V2_COURSE_CHECKOUT_ENABLED = "true";
process.env.V2_RECURRING_CHECKOUT_ENABLED = "true";
process.env.RAZORPAY_KEY_SECRET = "confirmation-test-secret";
const { createHmac } = require("node:crypto");
const userId = "000000000000000000000001";
const productId = "000000000000000000000002";
const checkoutId = "000000000000000000000003";
const checkout = { id: checkoutId, userId, productId, productType: "COURSE", checkoutType: "COURSE_RECURRING", status: "PROVIDER_CREATED", razorpaySubscriptionId: "sub_old", razorpayOrderId: null, paidAt: null, amountPaise: 79900, currency: "INR", idempotencyKey: "old-key" };
let authorized = true;
let calls = 0;
let transactions = 0;
let action = "RESUME";
class BillingReconciliationError extends Error {}
const prisma = {
  commerceCheckoutClaim: { findUnique: async ({ where }) => where.key.endsWith(":old-key") ? { checkoutId } : null },
  commerceCheckout: {
    findUnique: async () => checkout,
    findUniqueOrThrow: async () => checkout,
    findFirst: async ({ where }) => {
      if (where.userId !== userId) return null;
      if (where.id) return where.id === checkoutId ? checkout : null;
      if (where.idempotencyKey) return where.idempotencyKey === "old-key" ? checkout : null;
      return checkout;
    },
  },
  entitlement: { findFirst: async () => null },
  $transaction: async () => { transactions++; throw new Error("Unexpected duplicate checkout creation"); },
};
const originalLoad = Module._load;
Module._load = function (request) {
  const normalized = request.replaceAll("\\", "/");
  if (normalized.endsWith("lib/prisma")) return { prisma };
  if (normalized.endsWith("lib/roleAuth")) return { getDbUserFromClerk: async () => authorized ? { id: userId } : null };
  if (normalized.endsWith("lib/razorpay")) return { razorpay: {}, assertRazorpayServerConfiguration() {} };
  if (normalized.endsWith("lib/billing-reconciliation")) return { BillingReconciliationError, reconcileCheckout: async () => {
    calls++;
    if (action === "ERROR") throw new BillingReconciliationError("Provider unavailable");
    if (action === "CANCEL_LOCAL") checkout.status = "CANCELLED";
    if (action === "FULFILL") checkout.status = "PAID";
    return { action };
  } };
  return originalLoad.apply(this, arguments);
};
const intent = require("../app/api/checkout/intents/route.ts");
const status = require("../app/api/checkout/intents/[id]/route.ts");
const confirm = require("../app/api/checkout/intents/[id]/confirm/route.ts");
Module._load = originalLoad;
const params = { params: Promise.resolve({ id: checkoutId }) };
function request(key, checkoutType = "COURSE_RECURRING") {
  return new Request("http://localhost/api/checkout/intents", { method: "POST", body: JSON.stringify({ productType: "COURSE", productId, checkoutType, idempotencyKey: key }) });
}
function confirmation(signature) {
  return new Request("http://localhost/confirm", { method: "POST", body: JSON.stringify({ razorpay_subscription_id: "sub_old", razorpay_payment_id: "pay_1", razorpay_signature: signature }) });
}
async function main() {
  const fresh = await intent.POST(request("new-tab-key"));
  assert.equal(fresh.status, 200);
  assert.equal((await fresh.json()).subscription.id, "sub_old");
  assert.equal(transactions, 0);
  assert.equal((await intent.POST(request("old-key"))).status, 200);
  assert.equal(calls, 2); // Both key paths verify gateway state.
  const different = await intent.POST(request("one-time-key", "ONE_TIME"));
  assert.equal(different.status, 409);
  assert.equal((await different.json()).code, "CHECKOUT_PENDING");
  const before = calls;
  await status.GET(new Request("http://localhost/status"), params);
  assert.equal(calls, before);
  await status.GET(new Request("http://localhost/status?reconcile=true"), params);
  assert.equal(calls, before + 1);
  assert.equal((await confirm.POST(confirmation("invalid"), params)).status, 401);
  assert.equal(calls, before + 1);
  const signature = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update("pay_1|sub_old").digest("hex");
  action = "FULFILL";
  assert.equal((await confirm.POST(confirmation(signature), params)).status, 200);
  assert.equal(checkout.status, "PAID");
  checkout.status = "PROVIDER_CREATED";
  action = "CANCEL_LOCAL";
  const expired = await intent.POST(request("old-key"));
  assert.equal(expired.status, 409);
  assert.equal((await expired.json()).code, "CHECKOUT_TERMINAL");
  checkout.status = "PROVIDER_CREATED";
  action = "ERROR";
  assert.equal((await intent.POST(request("new-tab-key"))).status, 502);
  assert.equal(transactions, 0);
  authorized = false;
  assert.equal((await confirm.POST(confirmation(signature), params)).status, 401);
  console.log("checkout cross-session resume, confirmation authentication and expired-key regression tests passed");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
