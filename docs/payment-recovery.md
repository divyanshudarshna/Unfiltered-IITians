# Payment recovery and regression checks

## Verify and deploy

Run `npm run test:payments`. The 25 suites cover webhook authentication, atomic fulfillment, duplicate deliveries, signed checkout confirmation, missed renewals, cross-session retry, cancellation, orphan cleanup, recurring receipts, ownership and server-calculated legacy prices. They also reproduce delayed UPI charges, expired unlimited-session reservations, safe capped-seat re-acquisition, failed-review replay, refunded/cancelled payment protection and capacity-race rollback. Database/provider mutations are mocked.

Deploy the payment changes with matching Razorpay server and public keys for the same account and test/live mode. Configure `RAZORPAY_WEBHOOK_SECRET` (optionally `RAZORPAY_WEBHOOK_SECRET_PREVIOUS` during rotation), `RAZORPAY_WEBHOOK_INGESTION_ENABLED=true`, the existing V2 checkout flags, and `CRON_SECRET`. Keep the existing Razorpay webhook endpoint `/api/webhooks/razorpay` and billing cron `/api/internal/billing/release-expired-session-seats` enabled. No Prisma schema change is required.

The existing cron schedule in `vercel.json` runs daily. It repairs bounded batches of pending/review checkouts and overdue non-terminal recurring subscriptions, including records without subscription slots. Initial checkout confirmation and the owned checkout status endpoint (`?reconcile=true`) also reconcile on demand, including review checkouts. Provider GETs have a 10-second verification budget; fulfillment transactions have a 20-second timeout, and the webhook/confirmation/status routes allow 60 seconds. Transient failures roll back fulfillment for retry.

**A disabled Razorpay webhook still needs to be re-enabled in the matching account/mode after deployment.** Verify the deployed secret, ingestion flag and real delivery responses first. Code changes cannot enable a provider-side webhook. The daily cron is a fallback, not a guarantee of immediate access when the browser closes before confirmation. For faster recovery, configure a supported, authenticated scheduler to call the existing cron more frequently; no deployment/schedule change is made by these fixes.

## Delayed-payment seat policy

A 30-minute reservation expiry must not by itself prevent access after a verified charge. Fulfillment checks the existing checkout-owned hold against current inventory, not the capacity captured in an old checkout snapshot:

- An unlimited session can confirm an expired/released hold.
- A capped session can confirm a still-allocated `HELD` seat or atomically re-claim an available seat after release.
- Missing/reassigned holds, missing inventory and full capped sessions remain in review. Never steal another checkout's hold or overbook. Course inclusions are checked before any access is projected; a capacity race rolls back the whole transaction.
- An inclusion failure does not release an already-confirmed paid seat from another successful cycle.

Only fresh authenticated provider verification can replay a previously failed synthetic seat-review event with the identical event ID/hash. Successful events remain idempotent; webhook redelivery alone does not replay committed review failures. Existing cancelled/failed-checkout reviews, amount/currency mismatches and non-captured/refunded local payments must not be converted into paid access. Recovery reports `REQUIRES_REVIEW` when payment verification succeeded but fulfillment still needs intervention.

## Repair an existing student checkout

Use the student's login/account and Razorpay payment/subscription IDs to identify the checkout. Verify that the server credentials can read that subscription before applying repairs. An authentication failure must not be treated as proof that no payment occurred.

```sh
# Read-only, at most 100 pending/review checkouts; loads .env.local if available.
npm run billing:reconcile

# Read-only targeted inspection, including an already-paid checkout with a missed renewal.
npm run billing:reconcile -- --checkout=CHECKOUT_ID

# Apply the verified repair to the identified checkout.
npm run billing:reconcile -- --checkout=CHECKOUT_ID --apply
```

Recovery uses authenticated provider reads and requires captured, unrefunded payments with matching invoice/order, amount, currency, subscription, owner and billing plan. Verified paid invoice periods use the same fulfillment transaction as webhooks. Unpaid provider subscriptions that are cancelled/completed/expired close the local pending checkout and release held seats, subscription slots and reserved coupons. Pending creation with no provider ID and ambiguous/invalid provider data require investigation; records are retained rather than erased.

`dryRun` verifies provider data but does not test/claim seats or promise that access has been granted. After `--apply`, check the actual checkout/entitlement state. Historical review events/outbox entries can remain as diagnostic records; they are not proof that a subsequently recovered checkout is still blocked.

After repair, verify the checkout status, active entitlement/enrollment, dashboard subscription state and receipt. Students can use **Retry payment** to resume an unfinished authorization across browser sessions or **Cancel pending checkout** to abandon a verified unpaid attempt. Active paid cycles use end-of-cycle cancellation, preserving paid access. Never delete a pending record solely because the browser reported a failed payment or a webhook was delayed.

## Current verification limits

Local credentials are currently test-mode keys. The official Razorpay MCP can read test payments, but cannot locate the recorded affected payment with these credentials; that is not proof of non-payment. A customer screenshot showing successful UPI mandate setup is also not sufficient evidence of captured settlement. Verify the payment in the correct live account before a production repair or refund. No live access repair, refund, cancellation, webhook configuration change or deployment has been performed as part of these code fixes. Admin refund/access-termination controls are a separate follow-up phase.

`npm run test:payments` passes all 25 mocked regression suites. Full-project `npx tsc --noEmit --incremental false` still reports errors outside the changed payment files. An in-memory TypeScript comparison against the original `HEAD` versions confirms the same 79 diagnostics with zero added diagnostics; retain that distinction when evaluating a deployment. Actual MongoDB concurrency, production delivery and a live Razorpay charge have not been exercised by these mocked tests.
