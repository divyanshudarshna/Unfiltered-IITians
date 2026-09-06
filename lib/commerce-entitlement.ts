export type TimedEntitlement = {
  status: string;
  startsAt: Date;
  endsAt: Date | null;
};

export function isEntitlementActiveAt(entitlement: TimedEntitlement, now = new Date()) {
  return entitlement.status === "ACTIVE"
    && entitlement.startsAt <= now
    && (entitlement.endsAt === null || entitlement.endsAt > now);
}

// `undefined` means there is no earlier access record; `null` means perpetual access.
export function getLaterAccessEnd(
  existingEnd: Date | null | undefined,
  candidateEnd: Date | null,
) {
  if (existingEnd === undefined) return candidateEnd;
  if (existingEnd === null || candidateEnd === null) return null;
  return existingEnd > candidateEnd ? existingEnd : candidateEnd;
}
