import { createHmac, timingSafeEqual } from "node:crypto";
import type { RazorpayEntity } from "./razorpay-event";

export const PENDING_CHECKOUT_STATUSES = ["CREATED", "PROVIDER_CREATED", "PENDING"] as const;
export const TERMINAL_PROVIDER_STATUSES = ["cancelled", "completed", "expired"];

export function getSubscriptionCancellationMode(subscription: RazorpayEntity, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (TERMINAL_PROVIDER_STATUSES.includes(String(subscription.status))) return "TERMINAL";
  if (!["created", "authenticated", "active", "pending", "halted", "paused"].includes(String(subscription.status))) {
    throw new Error("Unknown subscription status");
  }
  const currentStart = subscription.current_start;
  const currentEnd = subscription.current_end;
  const hasCycle = typeof currentStart === "number" && typeof currentEnd === "number"
    && currentStart <= nowSeconds && currentEnd > nowSeconds;
  return hasCycle && ["active", "pending", "halted", "paused"].includes(String(subscription.status))
    ? "CYCLE_END" : "IMMEDIATE";
}

export function verifyCheckoutPaymentSignature(input: {
  paymentId: string;
  providerId: string;
  signature: string;
  recurring: boolean;
  secret: string;
}) {
  if (!/^[a-f0-9]{64}$/i.test(input.signature) || !input.secret) return false;
  const message = input.recurring
    ? `${input.paymentId}|${input.providerId}`
    : `${input.providerId}|${input.paymentId}`;
  const expected = createHmac("sha256", input.secret).update(message).digest();
  return timingSafeEqual(expected, Buffer.from(input.signature, "hex"));
}

export function assertCapturedRecoveryPayment(
  payment: RazorpayEntity,
  expected: { amountPaise: number; currency: string; orderId?: string; paymentId?: string },
) {
  if (typeof payment.id !== "string" || (expected.paymentId && payment.id !== expected.paymentId)
    || payment.status !== "captured" || payment.captured !== true
    || payment.amount !== expected.amountPaise || payment.currency !== expected.currency
    || (expected.orderId && payment.order_id !== expected.orderId)
    || (typeof payment.amount_refunded === "number" && payment.amount_refunded > 0)) {
    throw new Error("Provider payment is not an unrefunded captured payment matching this purchase");
  }
}

export function getRecoveredInvoicePeriod(invoice: RazorpayEntity, subscription: RazorpayEntity) {
  const paidAt = invoice.paid_at;
  if (typeof paidAt !== "number" || !Number.isSafeInteger(paidAt) || paidAt <= 0) {
    throw new Error("Paid subscription invoice is missing its provider payment timestamp");
  }
  const start = invoice.billing_start ?? subscription.current_start;
  const end = invoice.billing_end ?? subscription.current_end;
  if (typeof start !== "number" || typeof end !== "number"
    || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start <= 0 || end <= start
    // A missing invoice period must never attach an old payment to an unpaid cycle.
    || ((!invoice.billing_start || !invoice.billing_end) && (paidAt < start || paidAt >= end))) {
    throw new Error("Cannot establish the paid billing period for this subscription invoice");
  }
  return { start, end, paidAt };
}
