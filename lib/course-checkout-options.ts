export type CourseCheckoutType = "ONE_TIME" | "COURSE_RECURRING";

export function getCourseCheckoutAvailability(input: {
  subscriptionEnabled: boolean;
  recurringPlanAvailable: boolean;
}) {
  return {
    oneTime: true,
    recurring: input.subscriptionEnabled && input.recurringPlanAvailable,
  };
}

export function getDefaultCourseCheckoutType(): CourseCheckoutType {
  return "ONE_TIME";
}

export function isCourseCheckoutLaunchEnabled(
  checkoutType: CourseCheckoutType,
  verifiedCheckoutEnabled: boolean,
) {
  return checkoutType === "ONE_TIME" || verifiedCheckoutEnabled;
}

export function calculateCourseOneTimePricePaise(basePriceRupees: number, discountPct = 0) {
  const originalPaise = Math.round(basePriceRupees * 100);
  const discountPaise = Math.floor((originalPaise * discountPct) / 100);

  return {
    originalPaise,
    discountPaise,
    totalPaise: originalPaise - discountPaise,
  };
}
