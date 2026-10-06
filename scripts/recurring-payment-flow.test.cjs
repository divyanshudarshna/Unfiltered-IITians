const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const Module = require("node:module");
const path = require("node:path");
require("tsx/cjs");
const { Prisma } = require("@prisma/client");
process.env.RAZORPAY_WEBHOOK_SECRET = "integration-webhook-secret";
process.env.RAZORPAY_KEY_SECRET = "integration-api-secret";
process.env.RAZORPAY_WEBHOOK_INGESTION_ENABLED = "true";
const seconds = Math.floor(Date.now() / 1000);
let state;
let providerReads = 0;
let gatewayAmount = 79900;
let period = { start: seconds - 60, end: seconds + 3600, paidAt: seconds - 30, paymentId: "pay_1" };
function reset() {
  state = {
    checkout: { id: "checkout_1", userId: "owner", productType: "COURSE", productId: "course_1", checkoutType: "COURSE_RECURRING", status: "PROVIDER_CREATED", amountPaise: 79900, currency: "INR", razorpaySubscriptionId: "sub_1", paidAt: null, createdAt: new Date() },
    subscription: { id: "local_1", userId: "owner", courseId: "course_1", billingPlanId: "plan_local", originCheckoutId: "checkout_1", razorpaySubscriptionId: "sub_1", providerStatus: "CREATED", lastProviderEventAt: null, entitlementSnapshot: {} },
    events: [], payments: [], entitlements: [], enrollments: [], outbox: [],
  };
}
const plan = { id: "plan_local", razorpayPlanId: "plan_1", amountPaise: 79900, currency: "INR" };
const findCheckout = async ({ where }) => where.id === state.checkout.id && (!where.userId || where.userId === "owner") ? { ...state.checkout } : null;
const prisma = {
  async $transaction(fn) {
    const before = structuredClone(state);
    try { return await fn(prisma); } catch (error) { state = before; throw error; }
  },
  commerceCheckout: {
    findFirst: findCheckout, findUnique: findCheckout, findUniqueOrThrow: findCheckout,
    update: async ({ data }) => Object.assign(state.checkout, data),
  },
  courseBillingSubscription: {
    findUnique: async ({ where, include }) => where.razorpaySubscriptionId === "sub_1" ? { ...state.subscription, ...(include ? { billingPlan: plan } : {}) } : null,
    update: async ({ data }) => Object.assign(state.subscription, data),
    updateMany: async ({ data }) => { Object.assign(state.subscription, data); return { count: 1 }; },
  },
  courseBillingPlan: { findUnique: async () => plan },
  razorpayWebhookEvent: {
    create: async ({ data }) => {
      if (state.events.some((row) => row.providerEventId === data.providerEventId)) throw new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "test" });
      state.events.push({ ...data }); return data;
    },
    findUnique: async ({ where }) => state.events.find((row) => row.providerEventId === where.providerEventId) ?? null,
    update: async ({ where, data }) => Object.assign(state.events.find((row) => row.providerEventId === where.providerEventId), data),
  },
  commercePayment: {
    findUnique: async ({ where }) => state.payments.find((row) => row.externalKey === where.externalKey) ?? null,
    create: async ({ data }) => { const row = { id: `payment_${state.payments.length + 1}`, ...data }; state.payments.push(row); return row; },
  },
  entitlement: {
    findFirst: async ({ where }) => state.entitlements.find((row) => row.userId === where.userId && row.resourceId === where.resourceId && (!where.sourceId || row.sourceId === where.sourceId)
      && (!where.startsAt || row.startsAt <= where.startsAt.lte) && (!where.OR || !row.endsAt || row.endsAt > where.OR[1].endsAt.gt)) ?? null,
    create: async ({ data }) => { const row = { id: "entitlement_1", ...data }; state.entitlements.push(row); return row; },
    update: async ({ where, data }) => Object.assign(state.entitlements.find((row) => row.id === where.id), data),
  },
  enrollment: {
    findFirst: async () => state.enrollments[0] ?? null,
    create: async ({ data }) => { const row = { id: "enrollment_1", ...data }; state.enrollments.push(row); return row; },
    update: async ({ data }) => Object.assign(state.enrollments[0], data),
  },
  billingOutbox: {
    upsert: async ({ where, create }) => { const existing = state.outbox.find((row) => row.dedupeKey === where.dedupeKey); if (existing) return existing; state.outbox.push(create); return create; },
  },
};
const gateway = {
  subscriptions: { fetch: async () => { providerReads++; return { id: "sub_1", plan_id: "plan_1", status: "active", paid_count: 1, current_start: period.start, current_end: period.end + 3600 }; } },
  invoices: { all: async () => { providerReads++; return { items: [{ subscription_id: "sub_1", status: "paid", payment_id: period.paymentId, order_id: "order_1", amount_paid: 79900, currency: "INR", paid_at: period.paidAt, billing_start: period.start, billing_end: period.end }] }; } },
  payments: { fetch: async () => { providerReads++; return { id: period.paymentId, status: "captured", captured: true, amount: gatewayAmount, currency: "INR", order_id: "order_1", amount_refunded: 0 }; } },
};
const original = Module._load;
Module._load = function (request, parent) {
  const normalized = (request.startsWith(".") ? path.resolve(path.dirname(parent.filename), request) : request).replaceAll("\\", "/");
  if (normalized.endsWith("lib/prisma")) return { prisma };
  if (normalized.endsWith("lib/roleAuth")) return { getDbUserFromClerk: async () => ({ id: "owner" }) };
  if (normalized.endsWith("lib/razorpay")) return { razorpay: gateway, assertRazorpayServerConfiguration() {} };
  return original.apply(this, arguments);
};
const webhook = require("../app/api/webhooks/razorpay/route.ts");
const confirmation = require("../app/api/checkout/intents/[id]/confirm/route.ts");
const status = require("../app/api/checkout/intents/[id]/route.ts");
const { reconcileCheckout } = require("../lib/billing-reconciliation.ts");
Module._load = original;
const params = { params: Promise.resolve({ id: "checkout_1" }) };
function webhookRequest(eventId = "evt_1") {
  const body = JSON.stringify({ event: "subscription.charged", created_at: period.paidAt, payload: {
    subscription: { entity: { id: "sub_1", current_start: period.start, current_end: period.end } },
    payment: { entity: { id: period.paymentId, amount: 79900, currency: "INR", order_id: "order_1" } },
  } });
  return new Request("http://localhost/webhook", { method: "POST", body, headers: {
    "x-razorpay-event-id": eventId,
    "x-razorpay-signature": crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex"),
  } });
}
function confirmRequest() {
  return new Request("http://localhost/confirm", { method: "POST", body: JSON.stringify({
    razorpay_subscription_id: "sub_1", razorpay_payment_id: period.paymentId,
    razorpay_signature: crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${period.paymentId}|sub_1`).digest("hex"),
  }) });
}
async function assertFulfilled() {
  assert.equal(state.checkout.status, "PAID");
  assert.equal(state.payments.length, 1);
  assert.equal(state.payments[0].checkoutId, "checkout_1");
  assert.equal(state.enrollments.length, 1);
  assert.equal(state.entitlements.length, 1);
  assert.equal(state.entitlements[0].endsAt.getTime(), period.end * 1000);
  assert.equal(state.outbox.length, 1);
  const response = await status.GET(new Request("http://localhost/status"), params);
  assert.equal((await response.json()).entitlement.active, true);
}
async function main() {
  reset();
  assert.equal((await webhook.POST(webhookRequest())).status, 202);
  await assertFulfilled();
  assert.equal((await webhook.POST(webhookRequest())).status, 200);
  assert.equal(state.payments.length, 1);
  assert.equal(state.outbox.length, 1);
  assert.equal(providerReads, 0);

  reset(); // No webhook delivery: signed callback plus verified GETs repairs fulfillment.
  assert.equal((await confirmation.POST(confirmRequest(), params)).status, 200);
  await assertFulfilled();
  assert.equal(state.subscription.currentPeriodEnd.getTime(), period.end * 1000, "Unpaid provider period must not be presented as paid access");
  assert.equal((await webhook.POST(webhookRequest("late_evt"))).status, 202);
  await assertFulfilled();

  // Original checkout is PAID but the renewal webhook is missed.
  period = { start: seconds - 10, end: seconds + 7200, paidAt: seconds - 5, paymentId: "pay_renewal" };
  await reconcileCheckout({ ...state.checkout });
  assert.equal(state.payments.length, 2);
  assert.equal(state.entitlements.length, 1);
  assert.equal(state.enrollments.length, 1);
  assert.equal(state.entitlements[0].endsAt.getTime(), period.end * 1000);
  await reconcileCheckout({ ...state.checkout });
  assert.equal(state.payments.length, 2);
  assert.equal(state.outbox.length, 2);

  reset();
  gatewayAmount = 1;
  assert.equal((await confirmation.POST(confirmRequest(), params)).status, 502);
  assert.equal(state.checkout.status, "PROVIDER_CREATED");
  assert.equal(state.payments.length, 0);
  assert.equal(state.entitlements.length, 0);
  assert.equal(state.events.length, 0);
  console.log("Recurring webhook, missed-webhook confirmation, renewal, duplicate and amount-integrity integration tests passed");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
