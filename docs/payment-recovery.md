# Payment recovery and regression checks

## Verify and deploy

Run `npm run test:payments`. The 29 suites cover webhook authentication, atomic fulfillment, duplicate deliveries, signed checkout confirmation, missed renewals, cross-session retry, cancellation, orphan cleanup, recurring receipts, ownership and server-calculated legacy prices. They also reproduce delayed UPI charges, expired unlimited-session reservations, safe capped-seat re-acquisition, failed-review replay, refunded/cancelled payment protection, capacity-race rollback, admin financial actions and theme isolation. Database/provider mutations are mocked.

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

## Admin course termination and refunds

In `/admin/course-enrollments`, use the enrollment's actions menu:

- **Terminate access** expires course access and its included resources, cancels owned course mandates immediately, and issues no refund.
- **Terminate & refund** does the same and fully refunds **one selected captured payment**, not every recurring cycle. The server verifies ownership, amount/currency, capture and the paid subscription invoice in Razorpay. New refunds must be requested within seven days of verified payment; there is no outside-window override. Existing partial/full refunds are not refunded again.

Both actions require a reason and typing `TERMINATE`. Independently purchased mock/guidance access, the student's account and payment history are preserved. Terminated checkout/subscription/order markers prevent delayed callbacks and charged events from reactivating the old purchase; new purchases remain possible.

The **Captured payments needing access review** section also surfaces paid checkouts without an enrollment and unfinished termination actions. Lists are bounded to 50 recent checkout candidates and 200 recent pending action records. Email search scopes checkout discovery; operators should retain the displayed retry ID when investigating older operations.

Local access revocation is atomic. If cancellation cannot be confirmed, access remains terminated, the response is pending, and **no refund is initiated until future billing is confirmed stopped**. Retry the same action. Its frozen request is retained in browser session storage and recoverable from recent pending server records for the initiating admin. A definite preflight rejection before any operation exists permits changing the selection. Unknown outcomes retain the original request. Pending actions require an admin retry; the existing billing cron is not an admin-action worker.

Refund requests use a durable per-payment intent and Razorpay's `X-Refund-Idempotency` header with the exact same amount/body/key on retries. An accepted refund is not described as processed until Razorpay confirms processing. Signed refund webhooks update both V2 and already-recorded admin legacy refund receipts without downgrading processed refunds on out-of-order delivery. Audit records retain the actor, reason, scope and outcome. The financial API requires the actual `ADMIN` role; moderator permissions are insufficient.

All `/admin` and `/admin/*` pages force dark mode. Mock attempts temporarily force light mode through the shared theme provider, without changing the user's saved preference. Returning to admin restores dark mode.

For the isolated component/browser regression check, run `npm run build`, then `node scripts/admin-course-ui.test.cjs`. Puppeteer needs its installed Chrome or `PUPPETEER_EXECUTABLE_PATH` pointing to a compatible local browser. This verifies theme transitions, four viewport sizes, confirmation gating and identical financial retries with mocked APIs; it is not a live refund test.

## Current verification limits

Local credentials are currently test-mode keys. The official Razorpay MCP can read test payments, but cannot locate the recorded affected payment with these credentials; that is not proof of non-payment. A customer screenshot showing successful UPI mandate setup is also not sufficient evidence of captured settlement. Verify the payment in the correct live account before a production repair or refund. The reliability fix `e360d83` was successfully deployed through the existing production Vercel integration. Authenticated customer repair is still blocked locally by test-versus-live Clerk credentials. No live access repair, refund, cancellation or provider webhook configuration change was performed during development/testing.

`npm run test:payments` passes all 29 mocked regression suites, including strict admin authorization, seven-day eligibility, foreign/refunded payment rejection, cancellation failure, lost refund responses, local rollback, legacy refunds and delayed-event termination guards. The production build succeeds using the project's existing configuration that skips type/lint validation. Full-project TypeScript checks still report pre-existing errors (including generated Next route types after a build); an in-memory comparison against `HEAD` adds zero diagnostics. Actual MongoDB concurrency, authenticated production admin UI and a live Razorpay refund have not been exercised by the mocked tests.
