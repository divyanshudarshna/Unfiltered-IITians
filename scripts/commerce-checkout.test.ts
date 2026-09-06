import assert from "node:assert/strict";
import {
  CommerceCheckoutInputError,
  parseCheckoutIntentInput,
  parseRupeesToPaise,
} from "../lib/commerce-checkout";

assert.equal(parseRupeesToPaise("499"), 49900);
assert.equal(parseRupeesToPaise("499.5"), 49950);

assert.deepEqual(
  parseCheckoutIntentInput({
    productType: "MOCK_BUNDLE",
    productId: "bundle-1",
    studentPhone: " 9876543210 ",
    idempotencyKey: " checkout-1 ",
  }),
  {
    productType: "MOCK_BUNDLE",
    checkoutType: "ONE_TIME",
    productId: "bundle-1",
    couponCode: null,
    studentPhone: "9876543210",
    idempotencyKey: "checkout-1",
  },
);

assert.equal(
  parseCheckoutIntentInput({
    productType: "COURSE",
    checkoutType: "COURSE_RECURRING",
    productId: "course-1",
  }).checkoutType,
  "COURSE_RECURRING",
);

assert.equal(
  parseCheckoutIntentInput({
    productType: "MOCK_TEST",
    productId: "mock-1",
    checkoutType: "RECURRING",
  }).checkoutType,
  "RECURRING",
);

assert.throws(
  () => parseCheckoutIntentInput({ productType: "MOCK_TEST", productId: "" }),
  (error) => error instanceof CommerceCheckoutInputError,
);
assert.throws(() => parseRupeesToPaise("0.99"), /at least/);
assert.throws(() => parseRupeesToPaise("10.123"), /up to two decimals/);

console.log("commerce checkout tests passed");
