import assert from "node:assert/strict";
import { confirmCheckoutPayment, checkoutStatusUrl } from "../lib/client-checkout-confirmation";

async function main() {
  const originalFetch = globalThis.fetch;
  const payment = { razorpay_payment_id: "pay_1", razorpay_order_id: "order_1", razorpay_signature: "signature" };
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  let status = 200;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json({ error: "Invalid payment signature" }, { status });
  };
  try {
    await confirmCheckoutPayment("owned-checkout", payment);
    assert.equal(calls[0].url, "/api/checkout/intents/owned-checkout/confirm");
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), payment);
    status = 401;
    await assert.rejects(confirmCheckoutPayment("owned-checkout", payment), /Invalid payment signature/);
    status = 502;
    await confirmCheckoutPayment("owned-checkout", payment); // Polling/webhook can recover a transient provider failure.
    assert.equal(Array.from({ length: 24 }, (_, attempt) => checkoutStatusUrl("id", attempt)).filter(url => url.includes("reconcile=true")).length, 3);
    console.log("client confirmation signature rejection, transient fallback and bounded polling tests passed");
  } finally { globalThis.fetch = originalFetch; }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
