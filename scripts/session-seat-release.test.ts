import assert from "node:assert/strict";
import { shouldReleaseRecurringSessionSeat } from "../lib/session-seat-release";

const now = new Date("2026-01-15T12:00:00.000Z");

assert.equal(shouldReleaseRecurringSessionSeat({
  paymentStatus: "SUCCESS",
  billingSubscriptionId: "sub_local",
  accessEndsAt: new Date("2026-01-15T12:00:00.000Z"),
  seatReleasedAt: null,
  now,
}), true);
assert.equal(shouldReleaseRecurringSessionSeat({
  paymentStatus: "SUCCESS",
  billingSubscriptionId: "sub_local",
  accessEndsAt: new Date("2026-01-15T12:00:01.000Z"),
  seatReleasedAt: null,
  now,
}), false);
assert.equal(shouldReleaseRecurringSessionSeat({
  paymentStatus: "SUCCESS",
  billingSubscriptionId: null,
  accessEndsAt: new Date("2026-01-01T00:00:00.000Z"),
  seatReleasedAt: null,
  now,
}), false);
assert.equal(shouldReleaseRecurringSessionSeat({
  paymentStatus: "SUCCESS",
  billingSubscriptionId: "sub_local",
  accessEndsAt: new Date("2026-01-01T00:00:00.000Z"),
  seatReleasedAt: now,
  now,
}), false);

console.log("session seat release tests passed");
