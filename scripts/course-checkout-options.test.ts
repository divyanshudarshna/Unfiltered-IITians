import assert from "node:assert/strict";
import {
  calculateCourseOneTimePricePaise,
  getCourseCheckoutAvailability,
  getDefaultCourseCheckoutType,
  isCourseCheckoutLaunchEnabled,
} from "../lib/course-checkout-options";

assert.deepEqual(
  getCourseCheckoutAvailability({ subscriptionEnabled: true, recurringPlanAvailable: true }),
  { oneTime: true, recurring: true },
);
assert.deepEqual(
  getCourseCheckoutAvailability({ subscriptionEnabled: true, recurringPlanAvailable: false }),
  { oneTime: true, recurring: false },
);
assert.deepEqual(
  getCourseCheckoutAvailability({ subscriptionEnabled: false, recurringPlanAvailable: false }),
  { oneTime: true, recurring: false },
);
assert.equal(getDefaultCourseCheckoutType(), "ONE_TIME");
assert.equal(isCourseCheckoutLaunchEnabled("ONE_TIME", false), true);
assert.equal(isCourseCheckoutLaunchEnabled("COURSE_RECURRING", false), false);
assert.equal(isCourseCheckoutLaunchEnabled("COURSE_RECURRING", true), true);
assert.deepEqual(calculateCourseOneTimePricePaise(999, 33), {
  originalPaise: 99_900,
  discountPaise: 32_967,
  totalPaise: 66_933,
});
assert.deepEqual(calculateCourseOneTimePricePaise(799), {
  originalPaise: 79_900,
  discountPaise: 0,
  totalPaise: 79_900,
});

console.log("course checkout option tests passed");
