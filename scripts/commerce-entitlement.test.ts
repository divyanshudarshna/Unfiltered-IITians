import assert from "node:assert/strict";
import {
  getLaterAccessEnd,
  isEntitlementActiveAt,
} from "../lib/commerce-entitlement";

const now = new Date("2026-09-07T12:00:00.000Z");

assert.equal(
  isEntitlementActiveAt({ status: "ACTIVE", startsAt: new Date("2026-09-07T11:00:00.000Z"), endsAt: null }, now),
  true,
);
assert.equal(
  isEntitlementActiveAt({ status: "ACTIVE", startsAt: new Date("2026-09-07T13:00:00.000Z"), endsAt: null }, now),
  false,
);
assert.equal(
  isEntitlementActiveAt({ status: "ACTIVE", startsAt: new Date("2026-09-07T11:00:00.000Z"), endsAt: now }, now),
  false,
);
assert.equal(
  isEntitlementActiveAt({ status: "REVOKED", startsAt: new Date("2026-09-07T11:00:00.000Z"), endsAt: null }, now),
  false,
);

assert.deepEqual(
  getLaterAccessEnd(new Date("2026-10-01T00:00:00.000Z"), new Date("2026-09-30T00:00:00.000Z")),
  new Date("2026-10-01T00:00:00.000Z"),
);
assert.deepEqual(
  getLaterAccessEnd(new Date("2026-09-01T00:00:00.000Z"), new Date("2026-10-01T00:00:00.000Z")),
  new Date("2026-10-01T00:00:00.000Z"),
);
assert.deepEqual(
  getLaterAccessEnd(undefined, new Date("2026-10-01T00:00:00.000Z")),
  new Date("2026-10-01T00:00:00.000Z"),
);
assert.equal(getLaterAccessEnd(null, null), null);

console.log("commerce entitlement tests passed");
