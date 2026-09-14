export function getGuidanceSessionPricing(price: number, discountedPrice: number | null) {
  const validDiscount = discountedPrice !== null
    && discountedPrice >= 0
    && discountedPrice < price;
  const effectivePrice = validDiscount ? discountedPrice : price;
  return {
    effectivePrice,
    isDiscounted: validDiscount,
    discountPercentage: validDiscount && price > 0
      ? Math.round(((price - effectivePrice) / price) * 100)
      : 0,
  };
}
