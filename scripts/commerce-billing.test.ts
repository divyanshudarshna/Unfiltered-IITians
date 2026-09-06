import assert from "node:assert/strict";
import {
  CommerceBillingInputError,
  isSameCommerceBillingPlan,
  normalizeCommerceBillingInput,
} from "../lib/commerce-billing";

assert.deepEqual(normalizeCommerceBillingInput({}), {
  billingMode: "ONE_TIME",
  subscriptionEnabled: false,
  amountPaise: null,
  interval: "monthly",
  totalCount: 120,
});

const recurring = normalizeCommerceBillingInput({
  billingMode: "RECURRING",
  subscriptionEnabled: true,
  subscriptionAmount: "799.50",
  subscriptionInterval: "monthly",
  subscriptionTotalCount: 12,
});

assert.deepEqual(recurring, {
  billingMode: "RECURRING",
  subscriptionEnabled: true,
  amountPaise: 79950,
  interval: "monthly",
  totalCount: 12,
});

assert.equal(
  isSameCommerceBillingPlan(
    { amountPaise: 79950, currency: "INR", interval: "monthly", totalCount: 12 },
    recurring,
  ),
  true,
);

assert.throws(
  () => normalizeCommerceBillingInput({ billingMode: "RECURRING", subscriptionAmount: "0" }),
  CommerceBillingInputError,
);
assert.throws(
  () => normalizeCommerceBillingInput({ billingMode: "RECURRING", subscriptionAmount: "99", subscriptionInterval: "yearly" }),
  CommerceBillingInputError,
);

console.log("commerce billing tests passed");
