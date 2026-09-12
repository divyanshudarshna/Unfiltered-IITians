import assert from "node:assert/strict";
import { calculateSessionSeatAvailability } from "../lib/session-seat-inventory";

assert.equal(calculateSessionSeatAvailability(10, 2, 3), 5);
assert.equal(calculateSessionSeatAvailability(null, 2, 3), null);
assert.throws(() => calculateSessionSeatAvailability(4, 2, 3), /occupied seats/);
assert.throws(() => calculateSessionSeatAvailability(-1, 0, 0), /non-negative/);

console.log("session seat capacity tests passed");
