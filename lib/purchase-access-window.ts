import { getCourseExpiryDate } from "@/lib/course-expiry";

type PurchaseSnapshot = Record<string, unknown>;

function requirePositiveMonthCount(value: unknown) {
  const months = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(months) || months < 1) {
    throw new Error("Course duration snapshot is missing or invalid");
  }
  return months;
}

export function getCapturedCourseAccessWindow(snapshot: PurchaseSnapshot, capturedAt: Date) {
  if (Number.isNaN(capturedAt.getTime())) throw new Error("Payment capture date is invalid");
  const durationMonths = requirePositiveMonthCount(snapshot.durationMonths);
  return {
    startsAt: capturedAt,
    endsAt: getCourseExpiryDate(capturedAt, durationMonths),
  };
}

export function getSnapshottedCourseDurationMonths(createdAt: Date, initialExpiresAt: Date) {
  if (Number.isNaN(createdAt.getTime()) || Number.isNaN(initialExpiresAt.getTime())) {
    throw new Error("Legacy course duration snapshot is invalid");
  }
  const months = (
    (initialExpiresAt.getUTCFullYear() - createdAt.getUTCFullYear()) * 12
    + initialExpiresAt.getUTCMonth()
    - createdAt.getUTCMonth()
  );
  return requirePositiveMonthCount(months);
}

export function getGuidanceAccessEnd(snapshot: PurchaseSnapshot) {
  if (snapshot.sessionExpiryDate === undefined || snapshot.sessionExpiryDate === null) return null;
  if (typeof snapshot.sessionExpiryDate !== "string") {
    throw new Error("Guidance expiry snapshot is invalid");
  }
  const endsAt = new Date(snapshot.sessionExpiryDate);
  if (Number.isNaN(endsAt.getTime())) throw new Error("Guidance expiry snapshot is invalid");
  return endsAt;
}

export function getRecurringAccessStart(
  providerCapturedAt: Date | null,
  currentPeriodStart: Date | null,
  fallback: Date,
) {
  const start = providerCapturedAt ?? currentPeriodStart ?? fallback;
  if (Number.isNaN(start.getTime())) throw new Error("Recurring access start is invalid");
  return start;
}
