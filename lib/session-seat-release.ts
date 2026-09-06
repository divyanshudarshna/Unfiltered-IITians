export function shouldReleaseRecurringSessionSeat(input: {
  paymentStatus: string;
  billingSubscriptionId: string | null;
  accessEndsAt: Date | null;
  seatReleasedAt: Date | null;
  now: Date;
}) {
  return input.paymentStatus === "SUCCESS"
    && input.billingSubscriptionId !== null
    && input.accessEndsAt !== null
    && input.accessEndsAt <= input.now
    && input.seatReleasedAt === null;
}
