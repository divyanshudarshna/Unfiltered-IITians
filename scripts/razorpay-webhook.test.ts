import assert from "node:assert/strict";
import {
  createRazorpayWebhookSignature,
  getRazorpayWebhookSecrets,
  hashRazorpayWebhookBody,
  verifyRazorpayWebhookSignature,
} from "../lib/razorpay-webhook";

const rawBody = JSON.stringify({ event: "payment.captured", payload: { payment: { id: "pay_test" } } });
const currentSecret = "current-webhook-secret";
const previousSecret = "previous-webhook-secret";
const signature = createRazorpayWebhookSignature(rawBody, currentSecret);

assert.equal(verifyRazorpayWebhookSignature(rawBody, signature, [currentSecret]), true);
assert.equal(verifyRazorpayWebhookSignature(rawBody, signature, [previousSecret, currentSecret]), true);
assert.equal(verifyRazorpayWebhookSignature(`${rawBody} `, signature, [currentSecret]), false);
assert.equal(verifyRazorpayWebhookSignature(rawBody, "not-a-signature", [currentSecret]), false);
assert.equal(verifyRazorpayWebhookSignature(rawBody, null, [currentSecret]), false);
assert.equal(verifyRazorpayWebhookSignature(rawBody, signature, []), false);

assert.deepEqual(
  getRazorpayWebhookSecrets({
    RAZORPAY_WEBHOOK_SECRET: currentSecret,
    RAZORPAY_WEBHOOK_SECRET_PREVIOUS: previousSecret,
  }),
  [currentSecret, previousSecret],
);
assert.deepEqual(
  getRazorpayWebhookSecrets({ RAZORPAY_WEBHOOK_SECRET: "", RAZORPAY_WEBHOOK_SECRET_PREVIOUS: undefined }),
  [],
);
assert.equal(hashRazorpayWebhookBody(rawBody), hashRazorpayWebhookBody(rawBody));
assert.notEqual(hashRazorpayWebhookBody(rawBody), hashRazorpayWebhookBody(`${rawBody} `));

console.log("razorpay-webhook tests passed");
