import assert from "node:assert/strict";
import { getCourseAccessStatus } from "../lib/course-access-status";

const now = new Date("2026-09-17T12:00:00.000Z");

assert.deepEqual(
  getCourseAccessStatus({ enrollmentExpiresAt: new Date("2026-09-16T12:00:00.000Z"), now }),
  { isEnrolled: false, hasAccess: false, expiresAt: null },
);

assert.deepEqual(
  getCourseAccessStatus({
    enrollmentExpiresAt: new Date("2026-09-16T12:00:00.000Z"),
    entitlementEndsAt: new Date("2026-10-17T12:00:00.000Z"),
    now,
  }),
  {
    isEnrolled: true,
    hasAccess: true,
    expiresAt: new Date("2026-10-17T12:00:00.000Z"),
  },
);

console.log("course access status tests passed");
