import assert from "node:assert/strict";
import {
  getRazorpayAmount,
  getRazorpayEntity,
  getRazorpayEventDate,
  getRazorpayNote,
  getRazorpayString,
  getRazorpayUnixDate,
} from "../lib/razorpay-event";

const payload = {
  event: "subscription.charged",
  payload: {
    subscription: {
      entity: {
        id: "sub_live_123",
        created_at: 1700000000,
        current_start: 1700000000,
        current_end: 1702592000,
        notes: { checkout_id: "checkout_123" },
      },
    },
    payment: {
      entity: {
        id: "pay_live_123",
        amount: 49900,
        currency: "INR",
      },
    },
  },
} as const;

const subscription = getRazorpayEntity(payload, "subscription");
assert.equal(getRazorpayString(subscription, "id"), "sub_live_123");
assert.equal(getRazorpayAmount(getRazorpayEntity(payload, "payment")), 49900);
assert.equal(getRazorpayString(getRazorpayEntity(payload, "payment"), "currency"), "INR");
assert.equal(getRazorpayUnixDate(subscription, "current_start")?.getTime(), 1700000000000);
assert.equal(getRazorpayEventDate(payload).getTime(), 1700000000000);
assert.equal(getRazorpayEntity(payload, "refund"), null);
assert.equal(getRazorpayAmount({ amount: "49900" }), null);
assert.equal(getRazorpayNote(subscription, "checkout_id"), "checkout_123");
assert.equal(getRazorpayNote(subscription, "missing"), null);

console.log("razorpay event tests passed");
