export function getSessionExpiryDate(value: unknown): Date | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(String(value));
  const time = date.getTime();

  if (Number.isNaN(time) || time === 0) return null;

  return date;
}

export function hasSessionExpiry(value: unknown): boolean {
  return getSessionExpiryDate(value) !== null;
}

export function formatSessionExpiryDate(
  value: unknown,
  fallback = 'No expiry',
  locale = 'en-IN'
): string {
  const date = getSessionExpiryDate(value);

  if (!date) return fallback;

  return date.toLocaleDateString(locale);
}
