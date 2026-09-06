import assert from "node:assert/strict";
import { RazorpayPlanValidationError, validateRazorpayPlanMatch } from "../lib/razorpay-plan";

const localPlan = { amountPaise: 49900, currency: "INR", interval: "monthly" };

assert.doesNotThrow(() => validateRazorpayPlanMatch(localPlan, {
  item: { amount: 49900, currency: "INR" },
  period: "monthly",
  interval: 1,
}));

for (const providerPlan of [
  { item: { amount: 49901, currency: "INR" }, period: "monthly", interval: 1 },
  { item: { amount: 49900, currency: "USD" }, period: "monthly", interval: 1 },
  { item: { amount: 49900, currency: "INR" }, period: "yearly", interval: 1 },
  { item: { amount: 49900, currency: "INR" }, period: "monthly", interval: 2 },
]) {
  assert.throws(() => validateRazorpayPlanMatch(localPlan, providerPlan), RazorpayPlanValidationError);
}

console.log("razorpay plan tests passed");
