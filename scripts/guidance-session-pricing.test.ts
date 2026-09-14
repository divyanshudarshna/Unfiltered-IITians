import assert from "node:assert/strict";
import { getGuidanceSessionPricing } from "../lib/guidance-session-pricing";

assert.deepEqual(getGuidanceSessionPricing(999, null), {
  effectivePrice: 999,
  isDiscounted: false,
  discountPercentage: 0,
});
assert.deepEqual(getGuidanceSessionPricing(1000, 799), {
  effectivePrice: 799,
  isDiscounted: true,
  discountPercentage: 20,
});
assert.deepEqual(getGuidanceSessionPricing(1000, 1200), {
  effectivePrice: 1000,
  isDiscounted: false,
  discountPercentage: 0,
});

console.log("guidance session pricing tests passed");
