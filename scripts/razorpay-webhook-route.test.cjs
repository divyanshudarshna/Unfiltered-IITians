const assert = require("node:assert/strict");
const Module = require("node:module");
require("tsx/cjs");

let calls = [];
let result = { duplicate: false };
let failure;
const originalLoad = Module._load;
Module._load = function (request) {
  if (request.replaceAll("\\", "/").includes("lib/razorpay-webhook-processor")) {
    return { processRazorpayWebhookEvent: async (input) => {
      calls.push(input);
      if (failure) throw failure;
      return result;
    } };
  }
  return originalLoad.apply(this, arguments);
};
const { POST } = require("../app/api/webhooks/razorpay/route.ts");
const { createRazorpayWebhookSignature, hashRazorpayWebhookBody } = require("../lib/razorpay-webhook.ts");
Module._load = originalLoad;

const raw = JSON.stringify({ event: "subscription.charged", created_at: 1791237600 });
const current = "route-test-current-secret";
const previous = "route-test-previous-secret";
function request(body = raw, secret = current, headers = {}) {
  return new Request("http://localhost/api/webhooks/razorpay", {
    method: "POST", body,
    headers: { "x-razorpay-event-id": "evt_route_test", "x-razorpay-signature": createRazorpayWebhookSignature(body, secret), ...headers },
  });
}
async function main() {
  process.env.RAZORPAY_WEBHOOK_SECRET = current;
  process.env.RAZORPAY_WEBHOOK_SECRET_PREVIOUS = previous;
  process.env.RAZORPAY_WEBHOOK_INGESTION_ENABLED = "true";
  assert.equal((await POST(request())).status, 202);
  assert.equal(calls[0].payloadHash, hashRazorpayWebhookBody(raw));
  assert.equal((await POST(request(raw, previous))).status, 202);
  const accepted = calls.length;
  assert.equal((await POST(request(raw, "wrong-secret"))).status, 401);
  assert.equal((await POST(request(raw + " ", current, { "x-razorpay-signature": createRazorpayWebhookSignature(raw, current) }))).status, 401);
  assert.equal((await POST(request("not-json"))).status, 400);
  assert.equal((await POST(request("null"))).status, 400);
  assert.equal(calls.length, accepted);
  result = { duplicate: true };
  assert.equal((await POST(request())).status, 200);
  failure = new Error("retryable processor failure");
  assert.equal((await POST(request())).status, 503);
  failure = undefined;
  process.env.RAZORPAY_WEBHOOK_INGESTION_ENABLED = "false";
  assert.equal((await POST(request())).status, 503);
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  delete process.env.RAZORPAY_WEBHOOK_SECRET_PREVIOUS;
  assert.equal((await POST(request())).status, 503);
  console.log("razorpay-webhook route regression tests passed");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
