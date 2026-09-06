export type GeneralCouponProductType = "MOCK_BUNDLE" | "GUIDANCE_SESSION" | "INDIVIDUAL_MOCK" | "SUBSCRIPTION" | "OTHER";

export type GeneralCouponForCheckout = {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | string;
  discountValue: number;
  maxDiscountAmt: number | null;
  minOrderValue: number | null;
  usageLimit: number | null;
  usageCount: number;
  reservedCount: number;
  userLimit: number | null;
  productType: GeneralCouponProductType | string;
  productIds: readonly string[];
  validFrom: Date;
  validTill: Date;
  isActive: boolean;
};

export type GeneralCouponCheckoutResult = {
  couponId: string;
  couponCode: string;
  originalAmountPaise: number;
  discountPaise: number;
  amountPaise: number;
};

export class GeneralCouponCheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeneralCouponCheckoutError";
  }
}

function rupeesToPaise(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new GeneralCouponCheckoutError(`${field} is invalid`);
  }

  return Math.round(value * 100);
}

export function evaluateGeneralCouponForCheckout(input: {
  coupon: GeneralCouponForCheckout;
  productType: GeneralCouponProductType;
  productId: string;
  originalAmountPaise: number;
  userUsageCount: number;
  userReservationCount: number;
  now?: Date;
}): GeneralCouponCheckoutResult {
  const now = input.now ?? new Date();
  const { coupon } = input;
  if (!coupon.isActive) throw new GeneralCouponCheckoutError("This coupon is no longer active");
  if (coupon.validFrom > now || coupon.validTill <= now) {
    throw new GeneralCouponCheckoutError("This coupon is invalid or expired");
  }
  if (coupon.productType !== input.productType) {
    throw new GeneralCouponCheckoutError("This coupon is not valid for this product type");
  }
  if (coupon.productIds.length > 0 && !coupon.productIds.includes(input.productId)) {
    throw new GeneralCouponCheckoutError("This coupon is not valid for this product");
  }
  if (!Number.isSafeInteger(input.originalAmountPaise) || input.originalAmountPaise < 100) {
    throw new GeneralCouponCheckoutError("Checkout amount is invalid");
  }

  const minimumAmountPaise = coupon.minOrderValue === null ? null : rupeesToPaise(coupon.minOrderValue, "Coupon minimum order value");
  if (minimumAmountPaise !== null && input.originalAmountPaise < minimumAmountPaise) {
    throw new GeneralCouponCheckoutError("This coupon requires a higher order value");
  }
  if (coupon.usageLimit !== null && coupon.usageCount + coupon.reservedCount >= coupon.usageLimit) {
    throw new GeneralCouponCheckoutError("This coupon has reached its usage limit");
  }
  if (coupon.userLimit !== null && input.userUsageCount + input.userReservationCount >= coupon.userLimit) {
    throw new GeneralCouponCheckoutError("You have already used this coupon the maximum number of times");
  }

  let discountPaise: number;
  if (coupon.discountType === "PERCENTAGE") {
    if (!Number.isFinite(coupon.discountValue) || coupon.discountValue < 0 || coupon.discountValue > 100) {
      throw new GeneralCouponCheckoutError("This coupon has an invalid discount");
    }
    discountPaise = Math.floor((input.originalAmountPaise * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmt !== null) {
      discountPaise = Math.min(discountPaise, rupeesToPaise(coupon.maxDiscountAmt, "Coupon maximum discount"));
    }
  } else if (coupon.discountType === "FIXED_AMOUNT") {
    discountPaise = rupeesToPaise(coupon.discountValue, "Coupon discount");
  } else {
    throw new GeneralCouponCheckoutError("This coupon has an invalid discount type");
  }

  discountPaise = Math.min(discountPaise, input.originalAmountPaise);
  const amountPaise = input.originalAmountPaise - discountPaise;
  if (amountPaise < 100) {
    throw new GeneralCouponCheckoutError("This coupon cannot reduce checkout below ₹1");
  }

  return {
    couponId: coupon.id,
    couponCode: coupon.code,
    originalAmountPaise: input.originalAmountPaise,
    discountPaise,
    amountPaise,
  };
}
