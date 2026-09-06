import assert from "node:assert/strict";
import { getCheckoutPollingDecision, shouldMarkCheckoutFailed } from "../lib/checkout-status";

assert.equal(getCheckoutPollingDecision("PROVIDER_CREATED", false), "WAIT");
assert.equal(getCheckoutPollingDecision("PAID", false), "WAIT");
assert.equal(getCheckoutPollingDecision("PAID", true), "FULFILLED");
assert.equal(getCheckoutPollingDecision("FAILED", false), "FAILED");
assert.equal(getCheckoutPollingDecision("CANCELLED", false), "FAILED");
assert.equal(getCheckoutPollingDecision("REQUIRES_REVIEW", false), "REQUIRES_REVIEW");

assert.equal(shouldMarkCheckoutFailed("PROVIDER_CREATED"), true);
assert.equal(shouldMarkCheckoutFailed("PENDING"), true);
assert.equal(shouldMarkCheckoutFailed("PAID"), false);
assert.equal(shouldMarkCheckoutFailed("REQUIRES_REVIEW"), false);

console.log("checkout status tests passed");
