import assert from "node:assert/strict";
import {
  SESSION_SEAT_HOLD_MS,
  getSeatHoldCaptureDecision,
  getSeatHoldExpiresAt,
  isSeatHoldActive,
} from "../lib/session-seat-hold";

const now = new Date("2026-09-07T10:00:00.000Z");

assert.equal(SESSION_SEAT_HOLD_MS, 30 * 60 * 1000);
assert.deepEqual(
  getSeatHoldExpiresAt(now),
  new Date("2026-09-07T10:30:00.000Z"),
);
assert.equal(isSeatHoldActive("HELD", new Date("2026-09-07T10:29:59.999Z"), now), true);
assert.equal(isSeatHoldActive("HELD", now, now), false);
assert.equal(isSeatHoldActive("CONFIRMED", new Date("2026-09-07T10:29:59.999Z"), now), false);

assert.equal(
  getSeatHoldCaptureDecision({ status: "HELD", expiresAt: new Date("2026-09-07T10:30:00.000Z"), capturedAt: now }),
  "CONFIRM",
);
assert.equal(
  getSeatHoldCaptureDecision({ status: "CONFIRMED", expiresAt: new Date("2026-09-07T10:30:00.000Z"), capturedAt: now }),
  "ALREADY_CONFIRMED",
);
assert.equal(
  getSeatHoldCaptureDecision({ status: "EXPIRED", expiresAt: new Date("2026-09-07T10:30:00.000Z"), capturedAt: now }),
  "REQUIRES_REVIEW",
);
assert.equal(
  getSeatHoldCaptureDecision({ status: "HELD", expiresAt: new Date("2026-09-07T09:59:59.999Z"), capturedAt: now }),
  "REQUIRES_REVIEW",
);

console.log("session seat hold tests passed");
