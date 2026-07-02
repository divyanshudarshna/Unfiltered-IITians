import assert from "node:assert/strict";
import { getCourseExpiryDate } from "../lib/course-expiry";

assert.equal(
  getCourseExpiryDate("2025-11-30T12:09:14.001Z", 12).toISOString(),
  "2026-11-30T12:09:14.001Z",
  "12-month course access should expire on the same calendar date next year"
);

assert.equal(
  getCourseExpiryDate("2026-01-30T16:40:34.602Z", 6).toISOString(),
  "2026-07-30T16:40:34.602Z",
  "6-month course access should use calendar months, not 180 days"
);

assert.equal(
  getCourseExpiryDate("2025-01-31T10:00:00.000Z", 1).toISOString(),
  "2025-02-28T10:00:00.000Z",
  "end-of-month dates should clamp to the last day of the target month"
);

assert.equal(
  getCourseExpiryDate("2024-01-31T10:00:00.000Z", 1).toISOString(),
  "2024-02-29T10:00:00.000Z",
  "leap-year February should be handled correctly"
);

console.log("course-expiry tests passed");
