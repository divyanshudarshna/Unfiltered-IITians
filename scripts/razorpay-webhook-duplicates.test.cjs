const assert = require("node:assert/strict");
const Module = require("node:module");
require("tsx/cjs");
const { Prisma } = require("@prisma/client");
const conflict = new Prisma.PrismaClientKnownRequestError("Unique constraint", { code: "P2002", clientVersion: "6.14.0" });
let existing = null;
const originalLoad = Module._load;
Module._load = function (request) {
  const normalized = request.replaceAll("\\", "/");
  if (normalized.endsWith("lib/prisma") || normalized.endsWith("lib/prisma.ts")) {
    return { prisma: {
      $transaction: async () => { throw conflict; },
      razorpayWebhookEvent: { findUnique: async () => existing },
    } };
  }
  return originalLoad.apply(this, arguments);
};
const { processRazorpayWebhookEvent } = require("../lib/razorpay-webhook-processor.ts");
Module._load = originalLoad;
const input = { eventId: "evt_duplicate_test", eventType: "payment.captured", payload: { event: "payment.captured" }, payloadHash: "same-hash" };
async function main() {
  await assert.rejects(processRazorpayWebhookEvent(input), (error) => error === conflict);
  existing = { payloadHash: "different-hash" };
  await assert.rejects(processRazorpayWebhookEvent(input), (error) => error === conflict);
  existing = { payloadHash: input.payloadHash };
  assert.deepEqual(await processRazorpayWebhookEvent(input), { duplicate: true });
  console.log("razorpay-webhook duplicate transaction regression tests passed");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
