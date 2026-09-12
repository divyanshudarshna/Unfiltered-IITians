import assert from "node:assert/strict";
import { classifyWebhookProcessingError } from "../lib/webhook-processing";

assert.equal(classifyWebhookProcessingError(null), "PROCESSED");
assert.equal(
  classifyWebhookProcessingError("No V2 checkout found for Razorpay order order_123"),
  "RETRY",
);
assert.equal(
  classifyWebhookProcessingError("No V2 recurring subscription found for sub_123"),
  "RETRY",
);
assert.equal(
  classifyWebhookProcessingError("No V2 payment found for refund rfnd_123"),
  "RETRY",
);
assert.equal(
  classifyWebhookProcessingError("Payment pay_123 amount or currency does not match checkout checkout_123"),
  "ACKNOWLEDGE_REVIEW",
);

console.log("webhook processing tests passed");
