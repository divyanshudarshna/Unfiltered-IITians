import { NextResponse } from "next/server";
import {
  getRazorpayWebhookSecrets,
  hashRazorpayWebhookBody,
  verifyRazorpayWebhookSignature,
} from "@/lib/razorpay-webhook";
import { processRazorpayWebhookEvent } from "@/lib/razorpay-webhook-processor";
import type { RazorpayWebhookPayload } from "@/lib/razorpay-event";

export const runtime = "nodejs";

/**
 * Signed event ingestion foundation. Fulfillment stays disabled until the
 * transactional event processor and reconciliation job are deployed.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const eventId = req.headers.get("x-razorpay-event-id");
  const secrets = getRazorpayWebhookSecrets();

  if (!signature || !eventId) {
    return NextResponse.json({ error: "Missing Razorpay webhook headers" }, { status: 400 });
  }

  if (secrets.length === 0) {
    console.error("Razorpay webhook rejected: webhook secret is not configured");
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  }

  if (!verifyRazorpayWebhookSignature(rawBody, signature, secrets)) {
    return NextResponse.json({ error: "Invalid Razorpay webhook signature" }, { status: 401 });
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid webhook JSON" }, { status: 400 });
  }

  const eventType = typeof payload.event === "string" ? payload.event : null;
  if (!eventType) {
    return NextResponse.json({ error: "Webhook event type is required" }, { status: 400 });
  }

  // Keep provider retries active until the fulfillment processor is enabled.
  if (process.env.RAZORPAY_WEBHOOK_INGESTION_ENABLED !== "true") {
    return NextResponse.json({ error: "Webhook ingestion is not enabled" }, { status: 503 });
  }

  try {
    const result = await processRazorpayWebhookEvent({
      eventId,
      eventType,
      payload,
      payloadHash: hashRazorpayWebhookBody(rawBody),
    });
    return NextResponse.json({ received: true, duplicate: result.duplicate }, { status: result.duplicate ? 200 : 202 });
  } catch (error) {
    console.error("Razorpay webhook processing failed:", error);
    return NextResponse.json({ error: "Webhook could not be processed" }, { status: 503 });
  }
}
