import assert from "node:assert/strict";
import {
  formatSessionExpiryDate,
  getSessionExpiryDate,
  hasSessionExpiry,
} from "../lib/guidance-session-expiry";

assert.equal(getSessionExpiryDate(null), null, "null expiry should stay unset");
assert.equal(getSessionExpiryDate(""), null, "empty expiry should stay unset");
assert.equal(getSessionExpiryDate(0), null, "epoch expiry should stay unset");
assert.equal(
  getSessionExpiryDate("1970-01-01T00:00:00.000Z"),
  null,
  "stored epoch expiry should be treated as unset"
);

assert.equal(hasSessionExpiry(null), false, "missing expiry should not be valid");
assert.equal(
  formatSessionExpiryDate(null),
  "No expiry",
  "missing expiry should show no expiry in admin displays"
);

assert.equal(
  hasSessionExpiry("2026-06-09T00:00:00.000Z"),
  true,
  "real expiry dates should be valid"
);
assert.equal(
  formatSessionExpiryDate("2026-06-09T00:00:00.000Z"),
  "9/6/2026",
  "real expiry dates should be formatted for India"
);

console.log("guidance-session-expiry tests passed");
