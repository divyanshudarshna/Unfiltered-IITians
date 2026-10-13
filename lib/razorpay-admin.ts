import { assertRazorpayServerConfiguration } from "./razorpay";

/** Server-only requests. Refund retries MUST retain the same body and key. */
export async function razorpayAdminRequest<T extends Record<string, unknown>>(
  method: "GET" | "POST", path: string, body?: Record<string, unknown>, refundKey?: string,
): Promise<T> {
  assertRazorpayServerConfiguration();
  const authorization = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  let response: Response;
  try {
    response = await fetch(`https://api.razorpay.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/json",
        ...(refundKey ? { "X-Refund-Idempotency": refundKey } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    // A timed-out POST may have succeeded. Never claim failure or use a new key.
    throw new Error("Razorpay response unavailable; retry this same action to verify its outcome.");
  }
  if (!response.ok) throw new Error(`Razorpay could not confirm this action (HTTP ${response.status}). Retry the same action or check the Razorpay dashboard.`);
  return response.json() as Promise<T>;
}
