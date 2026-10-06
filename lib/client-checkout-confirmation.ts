import type { RazorpayResponse } from "../types/razorpay";

export async function confirmCheckoutPayment(checkoutId: string, payment: RazorpayResponse) {
  const response = await fetch(`/api/checkout/intents/${checkoutId}/confirm`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payment),
  });
  // Transient provider/server failures may still be resolved by the webhook and status polling.
  if (!response.ok && response.status < 500) {
    const data = await response.json();
    throw new Error(data.error || "Unable to verify payment confirmation. Please contact support.");
  }
}

export function checkoutStatusUrl(checkoutId: string, attempt: number) {
  return `/api/checkout/intents/${checkoutId}${[0, 12, 23].includes(attempt) ? "?reconcile=true" : ""}`;
}
