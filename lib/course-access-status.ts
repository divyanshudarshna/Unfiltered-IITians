interface CourseAccessStatusInput {
  enrollmentExpiresAt?: Date | null;
  entitlementEndsAt?: Date | null;
  now?: Date;
}

export function getCourseAccessStatus({
  enrollmentExpiresAt,
  entitlementEndsAt,
  now = new Date(),
}: CourseAccessStatusInput) {
  const accessWindows = [enrollmentExpiresAt, entitlementEndsAt].filter(
    (value): value is Date | null => value !== undefined,
  );
  const activeWindows = accessWindows.filter((endsAt) => endsAt === null || endsAt > now);
  const hasAccess = activeWindows.length > 0;
  const expiresAt = !hasAccess || activeWindows.includes(null)
    ? null
    : new Date(Math.max(...activeWindows.map((endsAt) => endsAt!.getTime())));

  return { isEnrolled: hasAccess, hasAccess, expiresAt };
}
