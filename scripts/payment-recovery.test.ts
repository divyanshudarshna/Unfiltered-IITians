import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { assertCapturedRecoveryPayment, getRecoveredInvoicePeriod, getSubscriptionCancellationMode, verifyCheckoutPaymentSignature } from "../lib/payment-recovery";

const secret = "recovery-test-secret";
for (const recurring of [false, true]) {
  const message = recurring ? "pay_1|sub_1" : "sub_1|pay_1";
  const signature = createHmac("sha256", secret).update(message).digest("hex");
  const input = { paymentId: "pay_1", providerId: "sub_1", secret, recurring, signature };
  assert.equal(verifyCheckoutPaymentSignature(input), true);
  assert.equal(verifyCheckoutPaymentSignature({ ...input, paymentId: "pay_other" }), false);
  assert.equal(verifyCheckoutPaymentSignature({ ...input, signature: "bad" }), false);
}
const payment = { id: "pay_1", status: "captured", captured: true, amount: 79900, currency: "INR", order_id: "order_1", amount_refunded: 0 };
const expected = { amountPaise: 79900, currency: "INR", orderId: "order_1", paymentId: "pay_1" };
assert.doesNotThrow(() => assertCapturedRecoveryPayment(payment, expected));
for (const change of [{ amount: 1 }, { status: "authorized" }, { captured: false }, { order_id: "another" }, { amount_refunded: 79900 }, { currency: "USD" }]) {
  assert.throws(() => assertCapturedRecoveryPayment({ ...payment, ...change }, expected));
}
assert.deepEqual(getRecoveredInvoicePeriod({ paid_at: 200, billing_start: 100, billing_end: 300 }, {}), { start: 100, end: 300, paidAt: 200 });
assert.throws(() => getRecoveredInvoicePeriod({ paid_at: 50 }, { current_start: 100, current_end: 300 }));
assert.throws(() => getRecoveredInvoicePeriod({ paid_at: 200 }, {}));
assert.throws(() => getRecoveredInvoicePeriod({ paid_at: 200, billing_start: 300, billing_end: 100 }, {}));
assert.equal(getSubscriptionCancellationMode({ status: "created" }, 200), "IMMEDIATE");
assert.equal(getSubscriptionCancellationMode({ status: "authenticated", current_start: 100, current_end: 300 }, 200), "IMMEDIATE");
assert.equal(getSubscriptionCancellationMode({ status: "active", current_start: 100, current_end: 300 }, 200), "CYCLE_END");
assert.equal(getSubscriptionCancellationMode({ status: "active", current_start: 100, current_end: 200 }, 201), "IMMEDIATE");
assert.equal(getSubscriptionCancellationMode({ status: "expired" }, 200), "TERMINAL");
assert.throws(() => getSubscriptionCancellationMode({ status: "unknown" }, 200));
console.log("payment recovery verification and cancellation mode tests passed");
