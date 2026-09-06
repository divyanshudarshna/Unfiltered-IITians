export type CheckoutPollingStatus =
  | "CREATED"
  | "PROVIDER_CREATED"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REQUIRES_REVIEW";

export type CheckoutPollingDecision = "WAIT" | "FULFILLED" | "FAILED" | "REQUIRES_REVIEW";

export function getCheckoutPollingDecision(
  status: CheckoutPollingStatus,
  hasActiveEntitlement: boolean,
): CheckoutPollingDecision {
  if (hasActiveEntitlement) return "FULFILLED";
  if (status === "FAILED" || status === "CANCELLED") return "FAILED";
  if (status === "REQUIRES_REVIEW") return "REQUIRES_REVIEW";
  return "WAIT";
}

// A late failure event must never undo an already captured payment or a review hold.
export function shouldMarkCheckoutFailed(status: CheckoutPollingStatus): boolean {
  return status !== "PAID" && status !== "REQUIRES_REVIEW";
}
