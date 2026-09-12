import assert from "node:assert/strict";
import {
  buildRazorpayPlanCreateInput,
  getRazorpayPlanCreationDecision,
  getRazorpayPlanRecoveryDecision,
  RazorpayPlanValidationError,
  validateRazorpayPlanMatch,
} from "../lib/razorpay-plan";

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

assert.deepEqual(
  buildRazorpayPlanCreateInput(localPlan, {
    name: "IIT JAM Monthly Course",
    description: "Four-month access plan",
    localPlanId: "local-plan-id",
    productType: "COURSE",
    productId: "course-id",
  }),
  {
    period: "monthly",
    interval: 1,
    item: {
      name: "IIT JAM Monthly Course",
      amount: 49900,
      currency: "INR",
      description: "Four-month access plan",
    },
    notes: {
      local_plan_id: "local-plan-id",
      product_type: "COURSE",
      product_id: "course-id",
      managed_by: "unfiltered_iitians_admin",
    },
  },
);

assert.throws(
  () => buildRazorpayPlanCreateInput({ ...localPlan, interval: "yearly" }, {
    name: "Invalid plan",
    localPlanId: "local-plan-id",
    productType: "COURSE",
    productId: "course-id",
  }),
  RazorpayPlanValidationError,
);

assert.equal(getRazorpayPlanCreationDecision({ status: "DRAFT", providerSyncState: "PENDING", razorpayPlanId: null }), "CREATE");
assert.equal(getRazorpayPlanCreationDecision({ status: "ACTIVE", providerSyncState: "ACTIVE", razorpayPlanId: "plan_123" }), "ALREADY_LINKED");
assert.equal(getRazorpayPlanCreationDecision({ status: "INACTIVE", providerSyncState: "PENDING", razorpayPlanId: null }), "BLOCKED");
assert.equal(getRazorpayPlanCreationDecision({ status: "DRAFT", providerSyncState: "CREATING", razorpayPlanId: null }), "BLOCKED");

assert.equal(getRazorpayPlanRecoveryDecision({ status: "DRAFT", providerSyncState: "CREATING", razorpayPlanId: null }), "RESET");
assert.equal(getRazorpayPlanRecoveryDecision({ status: "DRAFT", providerSyncState: "CREATE_REVIEW_REQUIRED", razorpayPlanId: null }), "RESET");
assert.equal(getRazorpayPlanRecoveryDecision({ status: "DRAFT", providerSyncState: "PENDING", razorpayPlanId: null }), "BLOCKED");
assert.equal(getRazorpayPlanRecoveryDecision({ status: "ACTIVE", providerSyncState: "CREATING", razorpayPlanId: null }), "BLOCKED");
assert.equal(getRazorpayPlanRecoveryDecision({ status: "DRAFT", providerSyncState: "CREATING", razorpayPlanId: "plan_123" }), "BLOCKED");

console.log("razorpay plan tests passed");
