import assert from "node:assert/strict";
import {
  GeneralCouponCheckoutError,
  evaluateGeneralCouponForCheckout,
} from "../lib/general-coupon-checkout";

const now = new Date("2026-09-07T10:00:00.000Z");
const baseCoupon = {
  id: "coupon-1",
  code: "SAVE20",
  discountType: "PERCENTAGE",
  discountValue: 20,
  maxDiscountAmt: null,
  minOrderValue: null,
  usageLimit: null,
  usageCount: 0,
  reservedCount: 0,
  userLimit: null,
  productType: "MOCK_BUNDLE",
  productIds: [],
  validFrom: new Date("2026-09-01T00:00:00.000Z"),
  validTill: new Date("2026-09-30T00:00:00.000Z"),
  isActive: true,
};

assert.deepEqual(
  evaluateGeneralCouponForCheckout({
    coupon: baseCoupon,
    productType: "MOCK_BUNDLE",
    productId: "bundle-1",
    originalAmountPaise: 10_100,
    userUsageCount: 0,
    userReservationCount: 0,
    now,
  }),
  {
    couponId: "coupon-1",
    couponCode: "SAVE20",
    originalAmountPaise: 10_100,
    discountPaise: 2_020,
    amountPaise: 8_080,
  },
);

assert.equal(
  evaluateGeneralCouponForCheckout({
    coupon: { ...baseCoupon, discountType: "FIXED_AMOUNT", discountValue: 99.5 },
    productType: "MOCK_BUNDLE",
    productId: "bundle-1",
    originalAmountPaise: 10_100,
    userUsageCount: 0,
    userReservationCount: 0,
    now,
  }).amountPaise,
  150,
);

assert.throws(
  () => evaluateGeneralCouponForCheckout({
    coupon: { ...baseCoupon, productIds: ["another-bundle"] },
    productType: "MOCK_BUNDLE",
    productId: "bundle-1",
    originalAmountPaise: 5_000,
    userUsageCount: 0,
    userReservationCount: 0,
    now,
  }),
  (error) => error instanceof GeneralCouponCheckoutError,
);

assert.throws(
  () => evaluateGeneralCouponForCheckout({
    coupon: { ...baseCoupon, usageLimit: 2, usageCount: 1, reservedCount: 1 },
    productType: "MOCK_BUNDLE",
    productId: "bundle-1",
    originalAmountPaise: 5_000,
    userUsageCount: 0,
    userReservationCount: 0,
    now,
  }),
  /usage limit/,
);

assert.throws(
  () => evaluateGeneralCouponForCheckout({
    coupon: { ...baseCoupon, userLimit: 1 },
    productType: "MOCK_BUNDLE",
    productId: "bundle-1",
    originalAmountPaise: 5_000,
    userUsageCount: 1,
    userReservationCount: 0,
    now,
  }),
  /maximum number of times/,
);

console.log("general coupon checkout tests passed");
