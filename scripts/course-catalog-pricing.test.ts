import assert from "node:assert/strict";
import { getCourseCatalogPricing } from "../lib/course-catalog-pricing";

assert.deepEqual(
  getCourseCatalogPricing({
    price: 7_999,
    actualPrice: 5_999,
    billingMode: "RECURRING",
    subscriptionEnabled: true,
    recurringPlan: {
      amountPaise: 49_900,
      interval: "monthly",
      totalCount: 12,
    },
  }),
  {
    kind: "RECURRING",
    amountRupees: 499,
    suffix: "/month",
    regularRupees: null,
    discountPercent: 0,
  },
);

assert.deepEqual(
  getCourseCatalogPricing({
    price: 7_999,
    actualPrice: 5_999,
    billingMode: "RECURRING",
    subscriptionEnabled: true,
    recurringPlan: null,
  }),
  {
    kind: "ONE_TIME",
    amountRupees: 5_999,
    suffix: null,
    regularRupees: 7_999,
    discountPercent: 25,
  },
);

assert.deepEqual(
  getCourseCatalogPricing({ price: 999, actualPrice: null }),
  {
    kind: "ONE_TIME",
    amountRupees: 999,
    suffix: null,
    regularRupees: null,
    discountPercent: 0,
  },
);

console.log("course catalog pricing tests passed");
