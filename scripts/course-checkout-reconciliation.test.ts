import assert from "node:assert/strict";
import {
  COURSE_CHECKOUT_STALE_MS,
  getStaleCourseCheckoutDecision,
  isCourseCheckoutStale,
} from "../lib/course-checkout-reconciliation";

const now = new Date("2026-09-13T12:00:00.000Z");
assert.equal(isCourseCheckoutStale(new Date(now.getTime() - COURSE_CHECKOUT_STALE_MS - 1), now), true);
assert.equal(isCourseCheckoutStale(new Date(now.getTime() - COURSE_CHECKOUT_STALE_MS + 1), now), false);
assert.equal(getStaleCourseCheckoutDecision("ONE_TIME", "created"), "CANCEL_LOCAL");
assert.equal(getStaleCourseCheckoutDecision("ONE_TIME", "attempted"), "CANCEL_LOCAL");
assert.equal(getStaleCourseCheckoutDecision("ONE_TIME", "paid"), "KEEP");
assert.equal(getStaleCourseCheckoutDecision("COURSE_RECURRING", "created"), "KEEP");
assert.equal(getStaleCourseCheckoutDecision("COURSE_RECURRING", "cancelled"), "CANCEL_LOCAL");
assert.equal(getStaleCourseCheckoutDecision("COURSE_RECURRING", "active"), "KEEP");

console.log("course checkout reconciliation tests passed");
