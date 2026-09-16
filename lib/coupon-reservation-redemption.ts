interface CouponReservation {
  id: string;
  couponId: string;
  status: "RESERVED" | "REDEEMED" | "RELEASED" | "EXPIRED";
}

export function getCouponRedemptionAccounting(
  reservation: CouponReservation | null,
  couponId: string,
) {
  if (reservation && reservation.couponId !== couponId) {
    throw new Error("Coupon reservation does not match checkout coupon");
  }

  return {
    alreadyRedeemed: reservation?.status === "REDEEMED",
    reservationId: reservation?.id ?? null,
    decrementReservedCount: reservation?.status === "RESERVED",
  };
}
