export type GeneralCouponProductType =
  | "MOCK_BUNDLE"
  | "GUIDANCE_SESSION"
  | "INDIVIDUAL_MOCK"
  | "SUBSCRIPTION"
  | "OTHER";

export type PublicGeneralCouponCandidate = {
  id: string;
  code: string;
  name?: string | null;
  description?: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | string;
  discountValue: number;
  maxDiscountAmt?: number | null;
  minOrderValue?: number | null;
  usageLimit?: number | null;
  usageCount?: number | null;
  productType: GeneralCouponProductType | string;
  productIds?: readonly string[] | null;
  validFrom?: Date | string | null;
  validTill: Date | string;
  isActive: boolean;
  isPublic?: boolean | null;
};

const getTime = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isFinite(time) ? time : null;
};

const formatNumber = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.00$/, "");

export function formatPublicGeneralCouponDiscount(coupon: PublicGeneralCouponCandidate) {
  if (coupon.discountType === "PERCENTAGE") {
    const baseLabel = `${formatNumber(coupon.discountValue)}% off`;
    return coupon.maxDiscountAmt
      ? `${baseLabel} up to ₹${formatNumber(coupon.maxDiscountAmt)}`
      : baseLabel;
  }

  return `₹${formatNumber(coupon.discountValue)} off`;
}

export function isGeneralCouponPublicForProduct(
  coupon: PublicGeneralCouponCandidate,
  productType: GeneralCouponProductType,
  productId?: string | null,
  orderValue?: number,
  now: Date = new Date()
) {
  if (!coupon.isPublic || !coupon.isActive) return false;
  if (coupon.productType !== productType) return false;

  const nowTime = now.getTime();
  const validFromTime = getTime(coupon.validFrom);
  const validTillTime = getTime(coupon.validTill);

  if (validFromTime !== null && validFromTime > nowTime) return false;
  if (validTillTime === null || validTillTime <= nowTime) return false;

  if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
    return false;
  }

  if (coupon.productIds?.length) {
    if (!productId || !coupon.productIds.includes(productId)) return false;
  }

  if (
    orderValue !== undefined &&
    coupon.minOrderValue !== null &&
    coupon.minOrderValue !== undefined &&
    orderValue < coupon.minOrderValue
  ) {
    return false;
  }

  return true;
}

export function toPublicGeneralCoupon(coupon: PublicGeneralCouponCandidate) {
  return {
    id: coupon.id,
    code: coupon.code,
    name: coupon.name,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscountAmt: coupon.maxDiscountAmt,
    minOrderValue: coupon.minOrderValue,
    validTill: coupon.validTill,
    discountLabel: formatPublicGeneralCouponDiscount(coupon),
  };
}
