# Payment recovery and regression checks

## Verify and deploy

Run `npm run test:payments`. The suite covers webhook authentication, atomic fulfillment, duplicate deliveries, signed checkout confirmation, missed renewals, cross-session retry, cancellation, orphan cleanup, recurring receipts, ownership and server-calculated legacy prices. Database/provider mutations are mocked.

Deploy the payment changes with matching Razorpay server and public keys for the same account and test/live mode. Configure `RAZORPAY_WEBHOOK_SECRET` (optionally `RAZORPAY_WEBHOOK_SECRET_PREVIOUS` during rotation), `RAZORPAY_WEBHOOK_INGESTION_ENABLED=true`, the existing V2 checkout flags, and `CRON_SECRET`. Keep the existing Razorpay webhook endpoint `/api/webhooks/razorpay` and billing cron `/api/internal/billing/release-expired-session-seats` enabled. No Prisma schema change is required.

The existing cron schedule in `vercel.json` runs daily. It repairs bounded batches of pending checkouts and overdue non-terminal recurring subscriptions, including records without subscription slots. Initial checkout confirmation and retry also reconcile on demand. Provider GETs have a 10-second verification budget; failures preserve payment records and reservations for retry.

## Repair an existing student checkout

Use the student's login/account and Razorpay payment/subscription IDs to identify the checkout. Verify that the server credentials can read that subscription before applying repairs. An authentication failure must not be treated as proof that no payment occurred.

```sh
# Read-only, at most 100 pending checkouts; loads .env.local if available.
npm run billing:reconcile

# Read-only targeted inspection, including an already-paid checkout with a missed renewal.
npm run billing:reconcile -- --checkout=CHECKOUT_ID

# Apply the verified repair to the identified checkout.
npm run billing:reconcile -- --checkout=CHECKOUT_ID --apply
```

Recovery uses authenticated provider reads and requires captured, unrefunded payments with matching invoice/order, amount, currency, subscription, owner and billing plan. Verified paid invoice periods use the same fulfillment transaction as webhooks. Unpaid provider subscriptions that are cancelled/completed/expired close the local pending checkout and release held seats, subscription slots and reserved coupons. Pending creation with no provider ID and ambiguous/invalid provider data require investigation; records are retained rather than erased.

After repair, verify the checkout status, active entitlement/enrollment, dashboard subscription state and receipt. Students can use **Retry payment** to resume an unfinished authorization across browser sessions or **Cancel pending checkout** to abandon a verified unpaid attempt. Active paid cycles use end-of-cycle cancellation, preserving paid access. Never delete a pending record solely because the browser reported a failed payment or a webhook was delayed.

## Current verification limits

The diagnostic dry-run found three existing pending checkouts, but the available local Razorpay credentials returned HTTP 401. Those records have not been repaired. Full-project TypeScript checking also reports pre-existing errors outside the changed payment files; retain that distinction when evaluating a deployment.
