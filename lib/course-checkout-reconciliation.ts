import type { CourseCheckoutType } from "./course-checkout-options";

export const COURSE_CHECKOUT_STALE_MS = 24 * 60 * 60 * 1000;

export type StaleCourseCheckoutDecision = "KEEP" | "CANCEL_LOCAL";

export function isCourseCheckoutStale(createdAt: Date, now: Date) {
  return now.getTime() - createdAt.getTime() >= COURSE_CHECKOUT_STALE_MS;
}

export function getStaleCourseCheckoutDecision(
  checkoutType: CourseCheckoutType,
  providerStatus: string,
): StaleCourseCheckoutDecision {
  if (checkoutType === "ONE_TIME") {
    return providerStatus === "created" || providerStatus === "attempted" ? "CANCEL_LOCAL" : "KEEP";
  }

  if (providerStatus === "cancelled" || providerStatus === "completed" || providerStatus === "expired") {
    return "CANCEL_LOCAL";
  }
  return "KEEP";
}
