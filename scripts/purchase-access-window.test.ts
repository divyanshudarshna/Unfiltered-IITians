import assert from "node:assert/strict";
import {
  getCapturedCourseAccessWindow,
  getGuidanceAccessEnd,
  getRecurringAccessStart,
  getSnapshottedCourseDurationMonths,
} from "../lib/purchase-access-window";

const capturedAt = new Date("2026-01-31T10:30:00.000Z");
assert.deepEqual(getCapturedCourseAccessWindow({ durationMonths: 1 }, capturedAt), {
  startsAt: capturedAt,
  endsAt: new Date("2026-02-28T10:30:00.000Z"),
});

assert.equal(
  getSnapshottedCourseDurationMonths(
    new Date("2026-01-31T10:30:00.000Z"),
    new Date("2026-04-30T10:30:00.000Z"),
  ),
  3,
);

assert.equal(
  getGuidanceAccessEnd({ sessionExpiryDate: "2026-06-15T18:30:00.000Z" })?.toISOString(),
  "2026-06-15T18:30:00.000Z",
);
assert.equal(getGuidanceAccessEnd({}), null);
assert.throws(() => getCapturedCourseAccessWindow({}, capturedAt), /duration snapshot/i);
assert.throws(
  () => getGuidanceAccessEnd({ sessionExpiryDate: "not-a-date" }),
  /expiry snapshot/i,
);

const recurringCapturedAt = new Date("2026-09-14T12:30:00.000Z");
const providerPeriodStart = new Date("2026-09-14T00:00:00.000Z");
assert.equal(
  getRecurringAccessStart(recurringCapturedAt, providerPeriodStart, new Date()).toISOString(),
  recurringCapturedAt.toISOString(),
);
assert.equal(
  getRecurringAccessStart(null, providerPeriodStart, new Date()).toISOString(),
  providerPeriodStart.toISOString(),
);

console.log("purchase access window tests passed");
