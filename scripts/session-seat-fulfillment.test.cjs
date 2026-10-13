const assert = require("node:assert/strict");
require("tsx/cjs");
const { confirmSessionSeatHold, confirmSessionSeatHolds } = require("../lib/session-seat-inventory.ts");
const now = new Date("2026-10-12T14:10:00Z");
function fixture(status = "HELD", capacity = null, availableSeats = null) {
  const holds = [{ id: "hold", checkoutId: "checkout", sessionId: "session", userId: "owner", status, expiresAt: new Date("2026-10-12T03:15:00Z") }];
  const inventory = { id: "inventory", sessionId: "session", capacity, availableSeats, heldCount: capacity !== null && status === "HELD" ? 1 : 0, confirmedCount: 0 };
  function matches(row, where) {
    return Object.entries(where).every(([key, value]) => {
      if (value && typeof value === "object" && !(value instanceof Date)) {
        if ("in" in value) return value.in.includes(row[key]);
        if ("gt" in value) return row[key] > value.gt;
      }
      return row[key] === value;
    });
  }
  function apply(row, data) {
    for (const [key, value] of Object.entries(data)) {
      row[key] = value && typeof value === "object" && !(value instanceof Date) && ("increment" in value || "decrement" in value)
        ? row[key] + (value.increment ?? 0) - (value.decrement ?? 0) : value;
    }
    return row;
  }
  const tx = {
    sessionSeatHold: {
      findFirst: async ({ where }) => holds.find((row) => matches(row, where)) ?? null,
      findUnique: async ({ where }) => holds.find((row) => matches(row, where)) ?? null,
      findMany: async ({ where }) => holds.filter((row) => matches(row, where)),
      updateMany: async ({ where, data }) => { const found = holds.filter((row) => matches(row, where)); found.forEach((row) => apply(row, data)); return { count: found.length }; },
      update: async ({ where, data }) => apply(holds.find((row) => matches(row, where)), data),
    },
    sessionSeatInventory: {
      findUnique: async ({ where }) => matches(inventory, where) ? { ...inventory } : null,
      update: async ({ data }) => apply(inventory, data),
      updateMany: async ({ where, data }) => { if (!matches(inventory, where)) return { count: 0 }; apply(inventory, data); return { count: 1 }; },
    },
  };
  return { tx, holds, inventory };
}
async function main() {
  for (const status of ["HELD", "EXPIRED", "RELEASED", "REQUIRES_REVIEW"]) {
    const f = fixture(status);
    assert.equal(await confirmSessionSeatHold(f.tx, "checkout", now, "session"), "CONFIRM", `Unlimited ${status} reservation must not block a paid course`);
    assert.equal(f.holds[0].status, "CONFIRMED");
    assert.equal(await confirmSessionSeatHold(f.tx, "checkout", now, "session"), "ALREADY_CONFIRMED");
  }
  const reserved = fixture("HELD", 1, 0);
  assert.equal(await confirmSessionSeatHold(reserved.tx, "checkout", now, "session"), "CONFIRM", "An unreleased reservation still owns its capped seat");
  assert.equal(reserved.inventory.heldCount, 0);
  assert.equal(reserved.inventory.confirmedCount, 1);
  const available = fixture("EXPIRED", 1, 1);
  assert.equal(await confirmSessionSeatHold(available.tx, "checkout", now, "session"), "CONFIRM");
  assert.equal(available.inventory.availableSeats, 0);
  assert.equal(available.inventory.confirmedCount, 1);
  const full = fixture("RELEASED", 1, 0);
  assert.equal(await confirmSessionSeatHold(full.tx, "checkout", now, "session"), "REQUIRES_REVIEW");
  assert.equal(full.inventory.confirmedCount, 0, "Never overbook a full session");
  const reused = fixture();
  reused.holds[0].checkoutId = "new-checkout";
  assert.equal(await confirmSessionSeatHold(reused.tx, "checkout", now, "session"), "REQUIRES_REVIEW", "Never steal a hold reused by another checkout");
  const batch = fixture("RELEASED");
  assert.equal(await confirmSessionSeatHolds(batch.tx, "checkout", ["session", "session"], now), null);
  assert.equal(batch.holds[0].status, "CONFIRMED");
  const partial = fixture("CONFIRMED", 1, 0);
  partial.inventory.confirmedCount = 1;
  assert.equal(await confirmSessionSeatHolds(partial.tx, "checkout", ["session", "missing"], now), "missing");
  assert.equal(partial.holds[0].status, "CONFIRMED", "A failed inclusion must not release an existing paid seat");
  console.log("Delayed/unlimited fulfillment, capped re-acquisition, ownership and batch seat safety tests passed");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
