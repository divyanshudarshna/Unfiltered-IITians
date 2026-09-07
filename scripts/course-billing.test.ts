import assert from "node:assert/strict";
import {
  calculateCourseSubscriptionTotalPaise,
  CourseBillingInputError,
  isSameCourseBillingPlan,
  normalizeCourseBillingInput,
  parseRupeesToPaise,
} from "../lib/course-billing";

assert.equal(parseRupeesToPaise("499"), 49900);
assert.equal(parseRupeesToPaise("499.5"), 49950);
assert.equal(parseRupeesToPaise("499.99"), 49999);
assert.equal(calculateCourseSubscriptionTotalPaise("59", 4), 23600);

assert.deepEqual(normalizeCourseBillingInput({}), {
  billingMode: "ONE_TIME",
  subscriptionEnabled: false,
  amountPaise: null,
  interval: "monthly",
  totalCount: 120,
});

const recurring = normalizeCourseBillingInput({
  billingMode: "RECURRING",
  subscriptionEnabled: true,
  subscriptionAmount: "499.00",
  subscriptionInterval: "monthly",
  subscriptionTotalCount: "12",
});
assert.deepEqual(recurring, {
  billingMode: "RECURRING",
  subscriptionEnabled: true,
  amountPaise: 49900,
  interval: "monthly",
  totalCount: 12,
});

assert.equal(
  isSameCourseBillingPlan(
    { amountPaise: 49900, currency: "INR", interval: "monthly", totalCount: 12 },
    recurring,
  ),
  true,
);
assert.equal(
  isSameCourseBillingPlan(
    { amountPaise: 49900, currency: "INR", interval: "monthly", totalCount: 24 },
    recurring,
  ),
  false,
);

for (const input of ["0", "0.99", "499.999", "-1", ""] ) {
  assert.throws(() => parseRupeesToPaise(input), CourseBillingInputError);
}
assert.throws(
  () => normalizeCourseBillingInput({ billingMode: "RECURRING", subscriptionAmount: "499", subscriptionTotalCount: 121 }),
  CourseBillingInputError,
);
assert.throws(
  () => normalizeCourseBillingInput({ billingMode: "RECURRING", subscriptionAmount: "499", subscriptionInterval: "yearly" }),
  CourseBillingInputError,
);
assert.throws(() => calculateCourseSubscriptionTotalPaise("59", 0), CourseBillingInputError);

console.log("course billing tests passed");
