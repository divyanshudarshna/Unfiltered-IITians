import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function createRazorpayWebhookSignature(rawBody: string, secret: string) {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

export function getRazorpayWebhookSecrets(
  env: {
    RAZORPAY_WEBHOOK_SECRET?: string;
    RAZORPAY_WEBHOOK_SECRET_PREVIOUS?: string;
  } = {},
) {
  return [env.RAZORPAY_WEBHOOK_SECRET, env.RAZORPAY_WEBHOOK_SECRET_PREVIOUS].filter(
    (secret): secret is string => Boolean(secret),
  );
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  receivedSignature: string | null,
  secrets: readonly string[],
) {
  if (!receivedSignature || secrets.length === 0) return false;

  let received: Buffer;
  try {
    received = Buffer.from(receivedSignature, "hex");
  } catch {
    return false;
  }

  return secrets.some((secret) => {
    const expected = Buffer.from(createRazorpayWebhookSignature(rawBody, secret), "hex");
    return expected.length === received.length && timingSafeEqual(expected, received);
  });
}

export function hashRazorpayWebhookBody(rawBody: string) {
  return createHash("sha256").update(rawBody, "utf8").digest("hex");
}
