import assert from "node:assert/strict";
import { getCouponRedemptionAccounting } from "../lib/coupon-reservation-redemption";

assert.deepEqual(
  getCouponRedemptionAccounting({ id: "r1", couponId: "c1", status: "RESERVED" }, "c1"),
  { alreadyRedeemed: false, reservationId: "r1", decrementReservedCount: true },
);

assert.deepEqual(
  getCouponRedemptionAccounting({ id: "r1", couponId: "c1", status: "EXPIRED" }, "c1"),
  { alreadyRedeemed: false, reservationId: "r1", decrementReservedCount: false },
);

assert.deepEqual(
  getCouponRedemptionAccounting({ id: "r1", couponId: "c1", status: "REDEEMED" }, "c1"),
  { alreadyRedeemed: true, reservationId: "r1", decrementReservedCount: false },
);

assert.throws(
  () => getCouponRedemptionAccounting({ id: "r1", couponId: "different", status: "RESERVED" }, "c1"),
  /does not match checkout coupon/,
);

console.log("coupon reservation redemption tests passed");
