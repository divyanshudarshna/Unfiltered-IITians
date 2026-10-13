import assert from "node:assert/strict";
import { classifyWebhookProcessingError, isRecoverableSeatReview } from "../lib/webhook-processing";

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
  classifyWebhookProcessingError("Captured payment pay_123 is missing its signed event timestamp"),
  "RETRY",
);
assert.equal(
  classifyWebhookProcessingError("Payment pay_123 amount or currency does not match checkout checkout_123"),
  "ACKNOWLEDGE_REVIEW",
);

assert.equal(isRecoverableSeatReview("Charged subscription sub_123 requires course-inclusion review"), true);
assert.equal(isRecoverableSeatReview("Captured payment pay_123 requires session-seat review"), true);
assert.equal(isRecoverableSeatReview("Recurring guidance subscription sub_123 requires session-seat review"), true);
assert.equal(isRecoverableSeatReview("Captured payment pay_123 belongs to a cancelled checkout"), false);
assert.equal(isRecoverableSeatReview("Payment pay_123 amount or currency does not match checkout checkout_123"), false);
assert.equal(isRecoverableSeatReview(null), false);

console.log("webhook processing tests passed");
