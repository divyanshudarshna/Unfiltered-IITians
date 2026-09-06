export type RazorpayEntity = Record<string, unknown>;

export type RazorpayWebhookPayload = {
  event: string;
  payload?: Record<string, { entity?: RazorpayEntity } | undefined>;
};

export function getRazorpayEntity(
  payload: RazorpayWebhookPayload,
  resource: string,
) {
  const value = payload.payload?.[resource];
  return value && typeof value === "object" && value.entity && typeof value.entity === "object"
    ? value.entity
    : null;
}

export function getRazorpayString(entity: RazorpayEntity | null, key: string) {
  const value = entity?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function getRazorpayNote(entity: RazorpayEntity | null, key: string) {
  const notes = entity?.notes;
  if (!notes || typeof notes !== "object" || Array.isArray(notes)) return null;
  const value = (notes as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function getRazorpayAmount(entity: RazorpayEntity | null) {
  const value = entity?.amount;
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export function getRazorpayUnixDate(entity: RazorpayEntity | null, key: string) {
  const value = entity?.[key];
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? new Date(value * 1000)
    : null;
}

export function getRazorpayEventDate(payload: RazorpayWebhookPayload) {
  return (
    getRazorpayUnixDate(getRazorpayEntity(payload, "payment"), "created_at") ??
    getRazorpayUnixDate(getRazorpayEntity(payload, "subscription"), "created_at") ??
    getRazorpayUnixDate(getRazorpayEntity(payload, "refund"), "created_at") ??
    new Date()
  );
}
