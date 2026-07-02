export function getCourseExpiryDate(startDate: Date | string, durationMonths: number) {
  const months = Math.trunc(durationMonths);

  if (!Number.isFinite(months) || months < 0) {
    throw new Error("durationMonths must be a non-negative number");
  }

  const expiryDate = new Date(startDate);

  if (Number.isNaN(expiryDate.getTime())) {
    throw new Error("startDate must be a valid date");
  }

  const originalDay = expiryDate.getUTCDate();
  expiryDate.setUTCDate(1);
  expiryDate.setUTCMonth(expiryDate.getUTCMonth() + months);

  const lastDayOfTargetMonth = new Date(
    Date.UTC(expiryDate.getUTCFullYear(), expiryDate.getUTCMonth() + 1, 0)
  ).getUTCDate();

  expiryDate.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));
  return expiryDate;
}
