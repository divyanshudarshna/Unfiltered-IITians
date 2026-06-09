import assert from "node:assert/strict";
import {
  formatPublicGeneralCouponDiscount,
  isGeneralCouponPublicForProduct,
} from "../lib/general-coupon-public";

const now = new Date("2026-06-09T12:00:00.000Z");
const baseCoupon = {
  id: "coupon-1",
  code: "GUIDE20",
  discountType: "PERCENTAGE",
  discountValue: 20,
  productType: "GUIDANCE_SESSION",
  productIds: [],
  validFrom: "2026-06-01T00:00:00.000Z",
  validTill: "2026-07-01T00:00:00.000Z",
  isActive: true,
  isPublic: true,
  usageCount: 0,
  usageLimit: null,
  minOrderValue: null,
} as const;

assert.equal(
  isGeneralCouponPublicForProduct(baseCoupon, "GUIDANCE_SESSION", "session-1", 1000, now),
  true,
  "active public guidance coupons should be visible"
);

assert.equal(
  isGeneralCouponPublicForProduct({ ...baseCoupon, isPublic: false }, "GUIDANCE_SESSION", "session-1", 1000, now),
  false,
  "private coupons should not be exposed"
);

assert.equal(
  isGeneralCouponPublicForProduct({ ...baseCoupon, isActive: false }, "GUIDANCE_SESSION", "session-1", 1000, now),
  false,
  "inactive coupons should not be exposed"
);

assert.equal(
  isGeneralCouponPublicForProduct({ ...baseCoupon, validTill: "2026-06-01T00:00:00.000Z" }, "GUIDANCE_SESSION", "session-1", 1000, now),
  false,
  "expired coupons should not be exposed"
);

assert.equal(
  isGeneralCouponPublicForProduct({ ...baseCoupon, productType: "MOCK_BUNDLE" }, "GUIDANCE_SESSION", "session-1", 1000, now),
  false,
  "coupons for other product types should not be exposed"
);

assert.equal(
  isGeneralCouponPublicForProduct({ ...baseCoupon, productIds: ["session-2"] }, "GUIDANCE_SESSION", "session-1", 1000, now),
  false,
  "product-restricted coupons should only show for matching products"
);

assert.equal(
  isGeneralCouponPublicForProduct({ ...baseCoupon, minOrderValue: 1500 }, "GUIDANCE_SESSION", "session-1", 1000, now),
  false,
  "coupons below the minimum order value should not be exposed"
);

assert.equal(formatPublicGeneralCouponDiscount(baseCoupon), "20% off");
assert.equal(
  formatPublicGeneralCouponDiscount({ ...baseCoupon, maxDiscountAmt: 500 }),
  "20% off up to ₹500"
);
assert.equal(
  formatPublicGeneralCouponDiscount({ ...baseCoupon, discountType: "FIXED_AMOUNT", discountValue: 250 }),
  "₹250 off"
);

console.log("general-coupon-public tests passed");
