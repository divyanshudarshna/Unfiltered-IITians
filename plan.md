# Verified Razorpay Payments And Monthly Subscriptions

## Status

**Implementation is in progress. Live Razorpay configuration, production environment secrets, and production database changes remain intentionally blocked until the release checklist is completed.**

This plan is intentionally staged because the application is live. The implementation must preserve all existing paid access while moving payment fulfillment from browser callbacks to verified Razorpay webhooks.

## Confirmed Scope

- Introduce verified Razorpay webhook fulfillment for every paid product currently offered:
  - Courses
  - Individual mock tests
  - Mock bundles
  - Guidance sessions
- Add genuine, auto-renewing Razorpay subscriptions for every paid resource: courses, individual mocks, mock bundles, and ongoing guidance programs.
- Let authorized admins configure a monthly subscription price and finite monthly-cycle limit while creating or editing every paid resource.
- Guidance sessions use recurring billing only as ongoing programs: one active subscriber occupies one seat, each successful charge extends paid access, and the seat is released after the final paid period ends.
- Keep legacy one-time purchases, enrollments, receipts, and active access working during a controlled migration.
- Do not automatically convert existing course purchasers into recurring mandates.

## Architecture Decision

### Payment Authority

1. Razorpay is authoritative for payment, refund, and recurring-subscription lifecycle events.
2. The database is authoritative for application access only after it has projected a verified Razorpay event, a controlled legacy entitlement, or an audited manual grant.
3. The browser is never authoritative for fulfillment. It can open Razorpay Checkout and show/poll payment status, but it cannot mark an order paid or grant access.
4. The existing `Subscription`, `Enrollment`, and `SessionEnrollment` records remain legacy compatibility data during the rollout. They will not be repurposed as recurring subscription records.

### Product Flows

| Product | Billing type | Razorpay object | Fulfillment authority |
| --- | --- | --- | --- |
| Course | One-time or monthly auto-renewal | Order or Plan + Subscription | Verified payment/subscription webhook |
| Individual mock | One-time or monthly auto-renewal | Order or Plan + Subscription | Verified payment/subscription webhook |
| Mock bundle | One-time or monthly auto-renewal | Order or Plan + Subscription | Verified payment/subscription webhook |
| Guidance program | One-time or monthly auto-renewal | Order or Plan + Subscription | Verified payment/subscription webhook |

### Implementation State

- Phase 0 containment has started: the legacy session payment-verification route now returns `410 Gone` and cannot mark an enrollment successful.
- The Razorpay dashboard guide below is preparation only. No live plan, webhook, API key, or production environment value has been created by this repository change.
- The new webhook endpoint must not be enabled for live fulfillment until its database inbox, event processor, entitlement writes, reconciliation, and monitoring have passed their release gates.

### Recurring Course Policy Proposed For V1

- Currency: INR.
- Cadence: monthly.
- Access begins or renews only after a captured Razorpay payment.
- Cancellation takes effect at the end of the current paid period.
- A failed or pending renewal does not extend access beyond the last successful paid period.
- No unpaid grace period in V1.
- A price or cadence change creates a new plan version. Existing subscribers remain on their original provider plan unless an explicit migration is approved.
- Coupons are disabled for recurring courses in V1. Razorpay offers can be added later only with an explicit, tested policy for first-cycle versus recurring discounts.
- A course can have at most one unresolved or active recurring subscription per user.

## Current-State Risks To Contain First

These are prerequisites, not optional cleanup. A new payment system cannot safely coexist with the current unsafe paths.

1. `POST /api/sessions/enrollment/[id]/verify-payment` currently has `const isValid = true`, which can mark a session enrollment successful without a Razorpay verification.
2. `POST /api/payment/order` accepts browser-controlled amounts for bundles and sessions; bundle mock IDs are browser controlled rather than derived from the bundle.
3. Current course and generic checkout endpoints accept a submitted Clerk user ID rather than deriving the buyer from server-side Clerk authentication.
4. Payment fulfillment is currently driven by client callbacks, with no Razorpay webhook recovery path for closed tabs, network errors, or delayed provider events.
5. Existing financial state is non-idempotent and mixes paid purchases, zero-value inclusions, and manual grants in `Subscription`.
6. `.env.sample` contains populated credential-like values. Treat all such values as exposed until rotated and removed from samples/history.
7. Several billing/admin routes need authorization review before they can be trusted for live payment operations.

## Target Data Model

All new money values use integer paise. Do not use `Float` for any newly introduced charge, discount, refund, fee, or revenue field.

### Additive Collections

| Collection | Responsibility | Essential fields / invariants |
| --- | --- | --- |
| `CourseBillingPlan` / `CommerceBillingPlan` | Versioned recurring configuration for courses and every other paid resource | Product type/ID, version, state, `amountPaise`, currency, interval, total billing cycles, Razorpay plan ID, sync state. Editing price/cadence creates a version; course records retain their original collection during migration. |
| `CommerceCheckout` | Server-created intent for exactly one product purchase | User, product type/ID, checkout type, immutable pricing/coupon/grant snapshot, local idempotency key, Razorpay order/subscription ID, status. |
| `CourseBillingSubscription` | Local projection of a Razorpay recurring course subscription | User, course, plan version, unique provider subscription ID, status, current period, next charge, cancellation metadata. |
| `CommercePayment` | Immutable payment lifecycle record | Unique provider payment/invoice/order key, amount/currency, status, checkout/subscription reference, captured/refunded timestamps. |
| `CommerceRefund` | Provider refund projection | Unique provider refund key, payment, amount/currency, status, reason, timestamps. |
| `Entitlement` | Single new source of paid-product access | User, resource type/ID, source, status, starts/ends, most recent payment. Bundles and course inclusions create explicit child entitlements from snapshots. |
| `RazorpayWebhookEvent` | Signed webhook inbox and idempotency gate | Unique `x-razorpay-event-id`, event name, payload hash/redacted payload, received/processed times, processing status/error. |
| `BillingOutbox` | Durable follow-up work | Deterministic dedupe key, action, payload, status, retry attempts, next retry time. Used for email, receipts, analytics, and alerts. |
| `CourseSubscriptionSlot` | Prevent concurrent duplicate course subscriptions | Unique user/course pair with pending checkout and active subscription references. |
| `BillingAuditLog` | Audits staff actions | Acting admin, action, reason, before/after data, event/request correlation, time. |

### Data Rules

- Preserve current `Subscription`, `Enrollment`, and `SessionEnrollment` documents unchanged at first.
- Add only new collections/indexes before switching product flows.
- Capture immutable checkout snapshots: product title, amount, coupon decision, bundle mock IDs, course inclusions, and plan version.
- Store provider IDs in separately indexed fields and use required unique external keys such as `razorpay:payment:<id>` rather than depending on nullable unique values.
- Confirm MongoDB production supports replica-set transactions before any event processor is deployed.
- Use `prisma db push` through a controlled release for MongoDB schema changes; Prisma SQL migrations are not the MongoDB migration mechanism.

## Verified Webhook Design

### Endpoint

Create a single exact public route:

```text
POST /api/webhooks/razorpay
```

The route is public only so Razorpay can deliver events. It must not use Clerk authentication. It is authenticated exclusively by Razorpay's webhook signature.

### Validation Requirements

1. Read the untouched raw request body with `await req.text()`.
2. Read `x-razorpay-signature` and `x-razorpay-event-id` headers.
3. Verify HMAC-SHA256 using `RAZORPAY_WEBHOOK_SECRET`, a separate secret from `RAZORPAY_KEY_SECRET`.
4. Use timing-safe signature comparison.
5. Parse JSON only after signature verification succeeds.
6. Store and deduplicate every event by `x-razorpay-event-id`.
7. Do not log full webhook payloads, payment signatures, card data, secrets, or unnecessary personal data.
8. Support current and previous webhook secrets during a deliberate secret-rotation overlap, because Razorpay may retry events signed with the previous secret.

Razorpay documents that webhook events can be duplicated and delivered out of order. The processor must use provider timestamps and permitted state transitions so an old event cannot overwrite a newer confirmed state.

### Atomic Event Processing

Within one MongoDB transaction:

1. Insert the webhook inbox record by event ID.
2. Resolve the corresponding local checkout, payment, or recurring subscription from a provider ID.
3. Verify amount, currency, expected product snapshot, and permitted state transition.
4. Upsert the payment/refund/subscription projection.
5. Grant, extend, retain, or revoke entitlements according to the event policy.
6. Insert idempotent outbox records for email, receipt, analytics, and alerts.
7. Mark the inbox record processed.

If processing fails before the transaction commits, return a retryable `5xx`. If an event is valid but cannot safely be mapped, persist a terminal exception/alert record and return `200` so retries do not repeat deterministic failures.

### Event Policy

| Event | Required local action | Access action |
| --- | --- | --- |
| `payment.captured` | Record one-time payment and complete checkout | Grant the one-time entitlement(s) |
| `payment.failed` | Record failure only | Never remove a previously captured entitlement |
| `refund.created` | Record pending refund | No automatic access change |
| `refund.processed` | Record final refund | Full refund follows approved revoke policy; partial refund requires review in V1 |
| `subscription.authenticated` | Mirror mandate/authentication state | No access grant by itself |
| `subscription.activated` | Mirror provider state and process any embedded captured payment | Grant only via shared captured-payment logic |
| `subscription.charged` | Record recurring payment and update period | Extend course entitlement through provider `current_end` |
| `subscription.pending` / `subscription.halted` | Record payment issue and alert | Do not extend access |
| `subscription.paused` / `subscription.resumed` | Mirror provider state | Keep already paid access through its end; no extension until charged |
| `subscription.cancelled` / `subscription.completed` | Mirror terminal provider state | Keep access through final paid end unless refund policy says otherwise |

## Checkout And Entitlement Flows

### Shared Server-Owned Checkout

Replace product-specific client-trusted checkout creation with an authenticated server endpoint such as:

```json
POST /api/checkout/intents
{
  "productType": "COURSE|MOCK|MOCK_BUNDLE|GUIDANCE_SESSION",
  "productId": "...",
  "couponCode": "optional"
}
```

The server must derive the user from Clerk, load only sellable/published records, calculate the price, validate coupons, snapshot grants, and create a local checkout before it calls Razorpay.

Never accept a buyer ID, price, discount amount, bundle contents, access duration, or entitlement list from the browser.

### One-Time Products

1. Create a pending `CommerceCheckout` with an immutable product and pricing snapshot.
2. Create a Razorpay Order and store its ID.
3. Open Razorpay Checkout using the provider order ID.
4. On `payment.captured`, verify amount/currency against the snapshot and grant entitlements.
5. The browser displays "Payment received. Confirming access..." and polls an authenticated checkout-status endpoint.

Bundle purchases grant exactly the mock IDs captured at checkout, even if an admin changes the bundle later.

Guidance sessions use a short seat hold. A late captured payment without remaining capacity enters a visible staff-resolution state; it must never be silently discarded or falsely marked enrolled.

### Recurring Courses

1. An admin creates a versioned local billing plan for the paid resource, then verifies and activates its matching Razorpay Plan.
2. An authenticated student creates/resumes a checkout; the server acquires the user/course slot and creates a Razorpay Subscription using the selected plan.
3. Store the provider subscription ID in `CourseBillingSubscription`.
4. Open Razorpay Checkout using `subscription_id`, not `order_id`.
5. Browser success is UX-only and polls status; it does not enroll the user directly.
6. A captured subscription charge creates a payment record and extends course access through the provider-reported billing-period end.
7. Cancellation prevents future extensions but preserves already paid access until the current entitlement end.

Legacy course purchasers keep their legacy enrollment/access. Do not create a Razorpay mandate on their behalf. The product UX can offer an explicit opt-in recurring plan once existing-access policy is approved.

## Admin Course Billing UX

Create a distinct billing section in the course form and course administration view rather than overloading the existing `price` and `actualPrice` fields.

### Admin Controls

- Billing mode: `OFF`, `ONE_TIME_LEGACY`, or `RECURRING`.
- Subscription sales enabled/disabled.
- Monthly recurring amount in INR, stored as paise server-side.
- Currency, cadence, and total billing-cycle limit.
- Razorpay plan ID and provider-sync state.
- Plan version/history.
- Pilot/feature-flag state per course.
- Terms/refund-policy version shown at checkout.
- A clear split between existing one-time price/discount fields and recurring price. Never overload `actualPrice` as the recurring amount.

### Admin Safeguards

- Price/cadence edits create new provider/local plan versions. They do not mutate active subscriber plans in place.
- Turning off subscription sales blocks new subscriptions but does not cancel existing ones.
- Replace any "mark payment paid" operation with an audited manual entitlement grant that includes a reason, date range, grantor, and revocation path.
- Add granular billing permissions for plan management, refunds, cancellation, reconciliation, and manual grants.
- Every provider-affecting admin action requires server-side RBAC, confirmation, audit logging, and an explicit reason.

## Phased Execution Plan

### Phase 0: Safety Containment And Production Prerequisites

1. Rotate Razorpay, Clerk, database, Cloudinary, and any other values exposed in `.env.sample` or source-control history.
2. Replace all sample secrets with placeholders and confirm history remediation with the repository owner.
3. Disable or return `410` from the session payment-verification route that hardcodes success.
4. Lock down/remove public destructive pending-session cleanup and unauthorized billing/admin endpoints.
5. Stop manual local marking of a provider payment as paid; replace with auditable grants later.
6. Back up MongoDB, perform a restore drill, and confirm replica-set transaction support.
7. Produce a legacy payment/access inventory: paid subscriptions, active/expired enrollments, successful sessions, duplicates, missing relations, payments with no access, and access with no permitted source.
8. Establish staging with sanitized data, distinct Razorpay test credentials, and an HTTPS webhook address.
9. Make the payment release pipeline fail on TypeScript, Prisma validation/generation, payment tests, and build errors. The current project-wide type issues must be handled or explicitly isolated before payment release.

**Exit criterion:** no active route can grant paid access based only on a browser-supplied claim or an unverified payment request.

### Phase 1: Additive Commerce Foundation

1. Add the collections, enums, indexes, validation helpers, and transaction boundaries described above.
2. Add the shared checkout/pricing service and a centralized entitlement reader.
3. Change access enforcement to dual-read safely:

```text
active V2 entitlement
OR valid legacy Enrollment / Subscription / SessionEnrollment
```

4. Backfill V2 `Entitlement` records from legacy access only, marked with `sourceKind = LEGACY`.
5. Do not fabricate provider events, Razorpay subscription mandates, or recurring agreements during backfill.
6. Add admin/reporting projections that label legacy records separately from V2 payments.

**Exit criterion:** sampled and automated checks show V2 dual-read access exactly matches valid existing user access.

### Phase 2: Webhook, Outbox, And Reconciliation In Test Mode

1. Implement `/api/webhooks/razorpay` using raw-body verification, event inbox deduplication, state transitions, and idempotent transactional fulfillment.
2. Add an authenticated checkout-status endpoint for browser polling.
3. Add durable outbox processing for confirmation emails, receipts, analytics, and staff alerts.
4. Add a protected reconciliation job:
   - Every 15-30 minutes: in-flight checkouts, pending webhooks, new subscriptions, and failed outbox work.
   - Daily: provider/local comparison of payments, refunds, subscription states, and entitlements.
5. Configure Razorpay test-mode webhook events for payments, refunds, and subscription lifecycle events.
6. Test duplicate, delayed, malformed, out-of-order, unknown, and amount-mismatched events.

**Exit criterion:** each test-mode provider event results in exactly one expected local payment and entitlement projection, including duplicate/replay scenarios.

### Phase 3: One-Time Product Cutover

Migrate in this order, using a server-side feature flag for each product:

1. Individual mocks.
2. Mock bundles.
3. Guidance sessions.
4. Any remaining one-time course compatibility purchase flow.

For each product:

1. Send new checkout creation through V2 only.
2. Freeze new writes from the legacy checkout route for that product.
3. Keep legacy access reads enabled during the coexistence window.
4. Keep old browser verification only as a non-authoritative acknowledgement for pre-cutover orders, then retire it after the agreed window.
5. Reconcile provider payments to local payments/entitlements daily.
6. Never use the insecure legacy fulfillment path as rollback.

**Exit criterion:** each product completes a monitored reconciliation window with no unexplained captured-payment/access mismatch.

### Phase 4: Recurring Course Subscription Pilot

1. Build the course billing form/API, Razorpay plan provisioning, recurring checkout, subscription dashboard, cancellation action, and support tooling.
2. Select one low-risk published course as a pilot.
3. Test full lifecycle in Razorpay test mode:
   - Authorization/authentication.
   - Initial payment and activation.
   - Renewal charge.
   - Pending/failed/halted renewal.
   - Cancellation at period end.
   - Pause/resume if supported.
   - Full and partial refund handling.
   - Browser polling, receipts, admin audit, and reconciliation.
4. Configure the pilot in live Razorpay only after test evidence is reviewed.
5. Roll out course-by-course after the pilot has a clean monitored period or equivalent complete provider test coverage.

**Exit criterion:** course access is renewed only from captured charges and staff can resolve cancellation, payment failure, and reconciliation exceptions without database surgery.

### Phase 5: Formal Cutover And Legacy Retirement

1. Record the cutoff timestamp per product.
2. Block all new legacy payment-order creation.
3. Continue accepting/reconciling provider events for pre-cutover orders through a defined grace window.
4. Retain legacy records for historic receipts, access compatibility, audit, and reporting comparison.
5. Move new billing history/revenue reporting to V2 ledger records and clearly label pre-cutover history as legacy.
6. Retire legacy writers only when no legacy payments remain pending, all access routes use the entitlement reader, and reconciliation remains clean for the agreed retention period.

## Rollback And Incident Rules

- Rollback disables new V2 checkout creation through feature flags and displays a safe temporary-unavailable message.
- Do not reactivate browser-driven or unverified legacy payment fulfillment as a rollback mechanism.
- Keep verified webhooks and reconciliation operating during an incident so captured payments can still be fulfilled or refunded.
- Keep all schema changes additive and legacy records intact.
- If an access regression occurs, dual-read legacy access can protect existing purchasers without granting unverified new purchases.
- Do not mass-cancel Razorpay mandates during an application rollback. Handle live subscriptions through a controlled, audited operational process and customer communication.

## Customer Experience Requirements

### Recurring Course Checkout

- Clearly show recurring amount, monthly cadence, auto-renewal, access period, cancellation effective date, and refund terms.
- After Razorpay success, display: "Authorization received. Confirming your subscription..."
- Poll server-side checkout status and show course access only after webhook fulfillment.
- Reuse an existing pending checkout to prevent repeated subscriptions from refreshes/double clicks.

### Billing Dashboard

- Show pending, active, halted, cancelled, completed, refunded, and legacy status distinctly.
- Show current access end, next charge, amount/cadence, plan version, and cancellation effective date.
- Provide cancellation for eligible active course subscriptions.
- Display receipts by captured payment cycle and refund status.
- Clearly label historic one-time purchases as legacy, not as auto-renewing subscriptions.

## Test Coverage Required Before Production

1. Raw-body HMAC validation, missing/invalid headers, and secret-rotation behavior.
2. Duplicate event ID and duplicate payment through separate provider events.
3. Out-of-order event handling, including failure followed by capture.
4. Amount/currency/product-snapshot mismatch rejection and alert creation.
5. Browser cannot choose another user, change price, change bundle contents, or grant itself access.
6. Bundle entitlement snapshot stays unchanged after a bundle is edited.
7. Session seat-hold race and captured late-payment resolution.
8. Course initial charge, renewal, failed renewal, halt, cancel, completion, and refund lifecycle.
9. Full versus partial refund entitlement policy.
10. Legacy access regression coverage during dual-read/backfill.
11. Outbox retries and idempotent email/receipt operations.
12. Reconciliation identifies and reports provider/local payment, entitlement, and subscription mismatches.
13. RBAC coverage for all billing admin operations.

## Monitoring And Alerts

Alert the billing owner for:

- Invalid webhook signature.
- Webhook processing error or excessive processing lag.
- Unknown provider order/payment/subscription.
- Amount or currency mismatch.
- Captured payment with no entitlement.
- Entitlement with no approved source.
- Pending/halted recurring subscription.
- Failed reconciliation or stale checkout/seat hold.
- Repeated outbox failure.
- No webhook traffic despite recent checkout creation.

## Business Decisions Required Before Implementation Approval

- [ ] Confirm monthly INR course subscriptions for V1.
- [ ] Set the Razorpay plan `totalCount` contract horizon. Proposed default: 120 monthly cycles, with an operational renewal review before the provider term ends.
- [ ] Approve no unpaid grace period after a failed renewal.
- [ ] Approve full-refund access revocation timing and partial-refund manual-review policy.
- [ ] Approve no recurring-course coupons in V1.
- [ ] Approve the session seat-hold duration and late-captured-payment resolution policy.
- [ ] Approve whether legacy active one-time course users may see an opt-in recurring offer before their current access expires.
- [ ] Approve the cancellation/refund/recurring-billing language to be published in customer policies.
- [ ] Name the billing owner and incident escalation contact.

## Production Prerequisites Required Before Live Rollout

- [ ] Rotate all credentials exposed or potentially exposed in repository samples/history; replace samples with placeholders.
- [ ] Create separate Razorpay test/live keys and separate webhook secrets.
- [ ] Confirm Razorpay Subscriptions is enabled and the account/payment methods are eligible for the selected recurring plan.
- [ ] Configure signed HTTPS Razorpay webhooks for payment, refund, and subscription events.
- [ ] Verify MongoDB backup/restore, replica-set transactions, and required indexes.
- [ ] Establish staging with sanitized data and Razorpay test mode.
- [ ] Secure existing session, payment, admin, and public endpoints described in Phase 0.
- [ ] Add CI gates for TypeScript, Prisma validation/generation, automated lifecycle tests, and production build success.
- [ ] Deploy/rehearse scheduled reconciliation and outbox processing.
- [ ] Complete test-mode lifecycle evidence and a controlled live pilot before broader enablement.

## Razorpay Live Dashboard Setup Guide

This guide describes the live dashboard actions only. Do not perform the webhook or plan steps until the repository implementation, deployment, environment variables, database schema, and smoke-test checklist for the relevant product are ready. Razorpay resources are not created by this repository change.

### Before Opening The Dashboard

1. Confirm the production site is served over HTTPS and has a stable public base URL. The webhook URL will be:

   ```text
   <PUBLIC_HTTPS_BASE_URL>/api/webhooks/razorpay
   ```

2. Confirm the deployed endpoint returns a fast `2xx` only after the signature is valid and that it does not require Clerk login.
3. Confirm production has these server-only variables configured through the hosting provider's encrypted environment settings, not Git:

   ```text
   RAZORPAY_KEY_ID=<live-key-id>
   RAZORPAY_KEY_SECRET=<live-api-key-secret>
   RAZORPAY_WEBHOOK_SECRET=<dedicated-live-webhook-secret>
   RAZORPAY_WEBHOOK_SECRET_PREVIOUS=<optional-during-rotation>
   NEXT_PUBLIC_RAZORPAY_KEY_ID=<live-key-id-for-browser-checkout>
   ```

4. `RAZORPAY_KEY_SECRET`, webhook secrets, database URLs, and provider credentials must never use the `NEXT_PUBLIC_` prefix or appear in browser code, logs, screenshots, `plan.md`, `.env.sample`, or commits.
5. Confirm the selected recurring course, price in INR, cadence, total cycle count, cancellation policy, refund policy, and support owner have been approved.
6. Take a current database backup and record the deployment commit, schema version, and feature-flag state before activating live payment.

### 1. Confirm Live Account Readiness

1. Sign in to the Razorpay Dashboard using the business owner account.
2. Switch the mode selector to **Live Mode**. Do not confuse Live Mode with Test Mode; keys, plans, subscriptions, and webhooks are mode-specific.
3. Confirm account onboarding, KYC/business verification, settlement/bank details, website/app details, support contact, refund policy, terms, and privacy information are complete.
4. Confirm the account is enabled for the required payment methods and Razorpay Subscriptions. If Subscriptions or a required mandate/payment method is unavailable, stop before creating a plan and contact Razorpay support/account management.
5. Confirm the live website domain and checkout disclosures match the business identity shown in Razorpay.

### 2. Generate Live API Keys

1. In the Dashboard, open **Account & Settings** and the API keys/API access section.
2. Choose **Generate Live Keys** or the equivalent live-key action.
3. Copy the live Key ID once. Treat the live Key Secret as a password; do not put either value in this repository.
4. Store the values in the production hosting provider's encrypted environment-variable store using the names above.
5. Redeploy or restart the application using the production environment. Do not paste the secret into a client component, webhook URL, ticket, chat, or issue.
6. Confirm the server can create a provider request with the live key without exposing the secret. A missing or invalid key must fail closed, not fall back to empty strings.
7. Record only the key ID suffix/rotation date in the operational runbook. Never record the secret.

### 3. Create A Recurring Course Plan

Razorpay plans cannot be edited or deleted. A price or cadence change requires a new plan and a new local `CourseBillingPlan` version; existing subscribers must remain mapped to their original provider plan.

1. Stay in **Live Mode**.
2. Open **Subscriptions** under **Payment Products**.
3. Open **Plans** and select **+ New Plan**.
4. Enter a stable descriptive name, for example `Course <internal-course-id> - Monthly - V1`. Do not include secret data or customer data.
5. Enter a description that states the course, recurring cadence, access relationship, and support contact without promising behavior not implemented by the application.
6. Choose the approved billing frequency, initially monthly if the V1 decision remains approved.
7. Enter the amount in the dashboard's INR minor currency unit. For INR, `₹499` means `49900` paise. Verify the amount twice before saving. The application must store the same value as integer `amountPaise`.
8. Enter the approved total billing cycles. Do not leave a finite contract horizon implicit; record the exact provider `totalCount` in the local plan configuration.
9. Add an internal note containing only the internal course ID, local plan version, deployment/change reference, and operator initials. Do not include API secrets or personal data.
10. Select **Create Plan**.
11. Copy the returned Razorpay `plan_id` into the protected admin/server configuration workflow. It must be persisted in the local versioned plan record, not hard-coded in source.
12. Verify the plan ID, amount, currency, frequency, and total count by fetching the plan through the server API or dashboard before enabling the course for sale.
13. If any value is wrong, do not try to edit it. Disable the local plan version, create a corrected provider plan, and retain the incorrect plan ID in an audit record.

### 4. Create The Live Razorpay Webhook

Do this only after the URL is available and the deployed route has passed signature tests. The URL must be public HTTPS; localhost and common request-bin/tunnel domains are not acceptable for the live dashboard.

1. Stay in **Live Mode**.
2. Open **Account & Settings**.
3. Under **Website and app settings**, open **Webhooks**.
4. Select **+ Add New Webhook**.
5. Enter exactly:

   ```text
   <PUBLIC_HTTPS_BASE_URL>/api/webhooks/razorpay
   ```

6. Enter a dedicated random webhook secret. It must not equal `RAZORPAY_KEY_SECRET`, the database password, Clerk secret, or any other credential.
7. Store the same secret as `RAZORPAY_WEBHOOK_SECRET` in the production encrypted environment store. Do not place it in the URL or repository.
8. Enter an alert email monitored by the billing owner and on-call operator.
9. Select the one-time payment/refund events used by the migrated products:
   - `payment.captured`
   - `payment.failed`
   - `refund.created`
   - `refund.processed`
10. Select the recurring course lifecycle events:
   - `subscription.authenticated`
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.completed`
   - `subscription.updated`
   - `subscription.pending`
   - `subscription.halted`
   - `subscription.paused`
   - `subscription.resumed`
   - `subscription.cancelled`
11. Select **Create Webhook**.
12. Record the webhook name, endpoint, selected events, creation time, and secret rotation date without recording the secret itself.
13. Confirm the deployed route returns within Razorpay's webhook response window. The handler should acknowledge only after durable inbox acceptance; slow downstream email/analytics work belongs in the outbox.

Razorpay retries failed deliveries for a limited period and can disable an unhealthy webhook. Monitor signature failures, `5xx` responses, processing lag, duplicate event IDs, and unmatched provider IDs immediately after activation.

### 5. Configure Course Subscription Activation

1. Confirm the local course billing plan has the exact live Razorpay `plan_id`, amount in paise, currency, frequency, total count, and approved display text.
2. Enable the course's recurring sales flag only after the live plan has been fetched and matched to the local record.
3. Ensure the course checkout creates a provider Subscription server-side and opens Standard Checkout with `subscription_id`; it must not accept a plan ID, amount, or user ID from the browser.
4. Ensure the browser callback is used only to show/poll confirmation. Course access must be granted by `subscription.charged`/the approved captured-payment webhook path.
5. Confirm the cancellation action calls the authenticated server API and provider cancellation flow, and that cancellation preserves access only through the last paid period.
6. Keep recurring-course coupons disabled unless the selected Razorpay offer behavior has been implemented and approved.

### 6. Configure One-Time Product Activation

1. Enable V2 checkout one product at a time using server-side feature flags.
    - The individual-mock pilot requires both `V2_CHECKOUT_ENABLED=true` and `NEXT_PUBLIC_V2_MOCK_CHECKOUT_ENABLED=true`; leave both unset until the webhook and database gates are complete. Monthly mock checkout additionally requires `NEXT_PUBLIC_V2_MOCK_SUBSCRIPTIONS_ENABLED=true` and an active, verified Razorpay plan.
    - The mock-bundle pilot requires `V2_CHECKOUT_ENABLED=true` and `NEXT_PUBLIC_V2_BUNDLE_CHECKOUT_ENABLED=true`. Enable it only after the GeneralCouponReservation schema, coupon reservation/redeem lifecycle, and webhook processor are deployed together. Monthly bundle checkout additionally requires `NEXT_PUBLIC_V2_BUNDLE_SUBSCRIPTIONS_ENABLED=true` and an active, verified Razorpay plan.
    - The course pilot requires `V2_CHECKOUT_ENABLED=true` and `NEXT_PUBLIC_V2_COURSE_CHECKOUT_ENABLED=true`. For a recurring course, also complete the local-plan **Verify & Activate** step before exposing checkout.
    - Set `RAZORPAY_WEBHOOK_INGESTION_ENABLED=true` only when the signed endpoint, new database collections/indexes, and transactional fulfillment path are deployed together.
2. Confirm the server derives the buyer from Clerk and calculates product price, bundle contents, session availability, and coupon behavior from the database.
3. Confirm Razorpay Orders use integer INR paise and the local checkout snapshot stores the same amount/currency.
4. Do not enable a product while its old client-controlled amount or unsafe fulfillment path remains active for new orders.
5. Keep legacy reads available during the defined migration window, but do not use old browser verification as a rollback path.
6. For recurring courses, create a plan manually in Razorpay Dashboard, save the local course plan draft, then use **Verify & Activate** in the course editor. The app fetches the provider plan and requires an exact amount, INR currency, and monthly-cadence match before recurring checkout can use it.
7. Do not enable V2 guidance-session checkout yet. The repository now has a 30-minute `SessionSeatHold` and atomic `SessionSeatInventory` design, but the new schema, expired-hold reconciliation, webhook processor, and a dedicated client flag must be deployed and verified together before exposing it. A late captured payment transitions to staff review rather than access. The existing shared session checkout must not be treated as a V2 rollback path.
8. `vercel.json` schedules the CRON_SECRET-protected recurring-session seat reconciliation once daily, which is compatible with Vercel's basic cron availability. A higher-frequency schedule may be configured only after confirming the production Vercel plan supports it.

### 7. Live Smoke Test Gate

Do not perform a live charge until all of these are true:

1. The public webhook URL is supplied, deployed, HTTPS, and reachable.
2. Production environment variables are present and verified without exposing secrets.
3. Database schema/indexes and transaction support are confirmed.
4. The exact product feature flag is enabled for the pilot only.
5. The billing owner is available to watch the Razorpay dashboard, application logs, webhook inbox, payment ledger, entitlement state, and customer email.
6. A small controlled live transaction is approved. Never use a real customer as an unannounced smoke test.
7. Complete the payment, close/reload the browser at the callback boundary, and verify that webhook processing still creates exactly one payment and entitlement.
8. Verify the amount/currency/order or subscription ID in Razorpay matches the local checkout snapshot.
9. Verify the customer sees access only after the server status becomes fulfilled.
10. Verify duplicate webhook delivery does not duplicate access, email, coupon usage, or revenue.
11. Record the transaction reference, webhook event IDs, timestamps, result, and any remediation without storing sensitive payment details.

### 8. After Activation: Monitoring And Replay

1. Watch the webhook dashboard for delivery status, latency, retries, and disabled-webhook warnings.
2. Watch local inbox events for signature failures, duplicate IDs, unknown provider IDs, amount mismatches, and processing errors.
3. Run the reconciliation job for pending checkouts, captured payments, refunds, subscription states, and entitlements.
4. If a valid event failed before processing, fix the code/configuration issue first, then use Razorpay's dashboard replay/retry capability or the controlled internal reprocessor. Do not manually mark the payment paid in the database.
5. If a payment is captured but cannot be mapped safely, leave it in an exception state, alert the billing owner, and resolve with a verified provider lookup or refund. Never silently grant or discard access.
6. Rotate the webhook secret through an overlap window: configure the new secret while accepting the previous one for provider retries, update the dashboard, verify deliveries, then remove the previous secret.

### Live Dashboard Safety Rules

- Never create a live plan or webhook before the application is ready to receive and process it.
- Never use the API key secret as the webhook secret.
- Never paste live secrets into Git, `.env.sample`, screenshots, tickets, or chat.
- Never delete an incorrect plan to hide an error; plans are immutable provider history.
- Never manually set `paid`, `SUCCESS`, or an entitlement to bypass webhook processing.
- Never make a live test charge before the webhook route, inbox, transaction processor, and reconciliation path are deployed.

## Approval Gate

Implementation is approved to proceed. Live Razorpay resource creation and live activation remain blocked until the public HTTPS webhook URL, production environment variables, database readiness, required business decisions, and the relevant staged smoke-test gate are confirmed. Repository changes must remain additive and must not directly replace all working live checkout flows in one release.
