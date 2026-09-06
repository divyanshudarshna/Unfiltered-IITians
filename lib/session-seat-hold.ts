export const SESSION_SEAT_HOLD_MS = 30 * 60 * 1000;

export type SessionSeatHoldStatus =
  | "HELD"
  | "CONFIRMED"
  | "EXPIRED"
  | "RELEASED"
  | "REQUIRES_REVIEW";

export function getSeatHoldExpiresAt(createdAt: Date) {
  return new Date(createdAt.getTime() + SESSION_SEAT_HOLD_MS);
}

export function isSeatHoldActive(
  status: SessionSeatHoldStatus,
  expiresAt: Date,
  now: Date,
) {
  return status === "HELD" && expiresAt > now;
}

export function getSeatHoldCaptureDecision(input: {
  status: SessionSeatHoldStatus;
  expiresAt: Date;
  capturedAt: Date;
}) {
  if (input.status === "CONFIRMED") return "ALREADY_CONFIRMED" as const;
  if (isSeatHoldActive(input.status, input.expiresAt, input.capturedAt)) {
    return "CONFIRM" as const;
  }
  return "REQUIRES_REVIEW" as const;
}
