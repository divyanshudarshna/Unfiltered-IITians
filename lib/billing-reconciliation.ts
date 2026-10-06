import type { CommerceCheckout, CourseSubscriptionProviderStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { assertRazorpayServerConfiguration, razorpay } from "./razorpay";
import { processRazorpayWebhookEvent } from "./razorpay-webhook-processor";
import { hashRazorpayWebhookBody } from "./razorpay-webhook";
import { releaseSessionSeatHold } from "./session-seat-inventory";
import { COURSE_CHECKOUT_STALE_MS } from "./course-checkout-reconciliation";
import { assertCapturedRecoveryPayment, getRecoveredInvoicePeriod, PENDING_CHECKOUT_STATUSES, TERMINAL_PROVIDER_STATUSES } from "./payment-recovery";
import type { RazorpayEntity, RazorpayWebhookPayload } from "./razorpay-event";

type RecoveryAction = "RESUME" | "FULFILL" | "CANCEL_LOCAL" | "KEEP";
type RecoveryOptions = { dryRun?: boolean; timeoutMs?: number };

export class BillingReconciliationError extends Error {
  constructor(cause: unknown) {
    super("Unable to verify the previous payment. Please retry shortly or contact support if money was debited.", { cause });
    this.name = "BillingReconciliationError";
  }
}

export async function closeUnpaidCheckout(checkoutId: string, providerStatus: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    const closed = await tx.commerceCheckout.updateMany({
      where: { id: checkoutId, status: { in: [...PENDING_CHECKOUT_STATUSES] } },
      data: { status: "CANCELLED" },
    });
    if (!closed.count) return false; // A racing capture/review must retain its access and reservations.
    const data = {
      providerStatus: (providerStatus === "completed" ? "COMPLETED" : "CANCELLED") as CourseSubscriptionProviderStatus,
      cancelAtPeriodEnd: false,
      ...(providerStatus !== "completed" ? { cancelledAt: now } : {}),
    };
    await tx.courseBillingSubscription.updateMany({ where: { originCheckoutId: checkoutId }, data });
    await tx.commerceBillingSubscription.updateMany({ where: { originCheckoutId: checkoutId }, data });
    await releaseSessionSeatHold(tx, checkoutId, now);
    await tx.commerceSubscriptionSlot.deleteMany({ where: { checkoutId } });
    const reservation = await tx.generalCouponReservation.findUnique({ where: { checkoutId } });
    if (reservation?.status === "RESERVED") {
      const released = await tx.generalCouponReservation.updateMany({
        where: { id: reservation.id, status: "RESERVED" }, data: { status: "RELEASED", releasedAt: now },
      });
      if (released.count) await tx.generalCoupon.update({ where: { id: reservation.couponId }, data: { reservedCount: { decrement: 1 } } });
    }
    return true;
  });
}

/** Server-only recovery: every fulfillment payload below originates from authenticated provider GETs. */
export async function reconcileCheckout(checkout: CommerceCheckout, options: RecoveryOptions = {}) {
  try { return await reconcileVerifiedCheckout(checkout, options); }
  catch (error) { throw new BillingReconciliationError(error); }
}

async function reconcileVerifiedCheckout(checkout: CommerceCheckout, options: RecoveryOptions) {
  const dryRun = options.dryRun ?? false;
  const events: RazorpayWebhookPayload[] = [];
  const observedAt = new Date();
  let providerStatus = "unknown";
  let action: RecoveryAction = "KEEP";
  let paidPeriod: { start: number; end: number } | undefined;
  const deadline = Date.now() + (options.timeoutMs ?? 10_000);
  // Only read-only requests race the timeout; late responses cannot trigger writes.
  async function providerRead<T>(read: () => Promise<T>): Promise<T> {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error("Payment provider verification timed out");
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([read(), new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Payment provider verification timed out")), remaining);
      })]);
    } finally { if (timer) clearTimeout(timer); }
  }
  assertRazorpayServerConfiguration();

  if (checkout.razorpaySubscriptionId) {
    const fetched = await providerRead(() => razorpay.subscriptions.fetch(checkout.razorpaySubscriptionId!));
    const subscription = fetched as unknown as RazorpayEntity;
    if (subscription.id !== checkout.razorpaySubscriptionId) throw new Error("Provider subscription does not match checkout");
    const local = checkout.checkoutType === "COURSE_RECURRING"
      ? await prisma.courseBillingSubscription.findUnique({ where: { razorpaySubscriptionId: checkout.razorpaySubscriptionId }, include: { billingPlan: true } })
      : await prisma.commerceBillingSubscription.findUnique({ where: { razorpaySubscriptionId: checkout.razorpaySubscriptionId }, include: { billingPlan: true } });
    if (!local || local.userId !== checkout.userId || local.originCheckoutId !== checkout.id
      || local.billingPlan.razorpayPlanId !== subscription.plan_id) throw new Error("Provider subscription does not match its owned billing plan");
    providerStatus = String(subscription.status);
    const invoices = await providerRead(() => razorpay.invoices.all({ subscription_id: checkout.razorpaySubscriptionId!, count: 100 }));
    // The latest paid cycle restores current access; older periods must not move state backwards.
    const paidInvoices = invoices.items.map((invoice) => invoice as unknown as RazorpayEntity)
      .filter((invoice) => invoice.status === "paid")
      .sort((a, b) => Number(b.paid_at) - Number(a.paid_at));
    const invoice = paidInvoices[0];
    if (invoice) {
      if (invoice.subscription_id !== subscription.id || typeof invoice.payment_id !== "string"
        || typeof invoice.order_id !== "string" || invoice.amount_paid !== local.billingPlan.amountPaise
        || invoice.currency !== local.billingPlan.currency) throw new Error("Paid invoice does not match this subscription and plan");
      const payment = await providerRead(() => razorpay.payments.fetch(invoice.payment_id as string));
      assertCapturedRecoveryPayment(payment as unknown as RazorpayEntity, {
        paymentId: invoice.payment_id, orderId: invoice.order_id,
        amountPaise: local.billingPlan.amountPaise, currency: local.billingPlan.currency,
      });
      const period = getRecoveredInvoicePeriod(invoice, subscription);
      paidPeriod = period;
      events.push({ event: "subscription.charged", created_at: period.paidAt, payload: {
        subscription: { entity: { id: subscription.id, current_start: period.start, current_end: period.end, notes: { checkout_id: checkout.id } } },
        payment: { entity: { id: payment.id, amount: payment.amount, currency: payment.currency, order_id: payment.order_id } },
      } });
      action = "FULFILL";
    } else if (Number(subscription.paid_count) > 0) {
      throw new Error("Provider reports paid cycles but no verifiable paid invoice was returned");
    } else if (TERMINAL_PROVIDER_STATUSES.includes(providerStatus)) {
      action = "CANCEL_LOCAL";
    } else if (providerStatus === "created" && (!fetched.expire_by || fetched.expire_by * 1000 > Date.now())) {
      action = "RESUME";
    }
    if (!dryRun) {
      for (const event of events) await applyVerifiedEvent(event);
      if (action === "CANCEL_LOCAL") await closeUnpaidCheckout(checkout.id, providerStatus);
      // Synchronize terminal/pending state AFTER charge recovery, so an old charge
      // cannot reactivate a cancelled mandate. Never erase the verified paid period.
      const status = providerStatus === "expired" ? "CANCELLED" : providerStatus.toUpperCase();
      if (["CREATED", "AUTHENTICATED", "ACTIVE", "PENDING", "HALTED", "PAUSED", "CANCELLED", "COMPLETED"].includes(status)) {
        const data = {
          providerStatus: status as CourseSubscriptionProviderStatus,
          lastProviderEventAt: observedAt,
          ...(paidPeriod ? { currentPeriodStart: new Date(paidPeriod.start * 1000), currentPeriodEnd: new Date(paidPeriod.end * 1000) } : {}),
          ...(TERMINAL_PROVIDER_STATUSES.includes(providerStatus) ? { cancelAtPeriodEnd: false } : {}),
        };
        const where = { id: local.id, OR: [{ lastProviderEventAt: null }, { lastProviderEventAt: { lte: observedAt } }] };
        if (checkout.checkoutType === "COURSE_RECURRING") await prisma.courseBillingSubscription.updateMany({ where, data });
        else await prisma.commerceBillingSubscription.updateMany({ where, data });
      }
    }
  } else if (checkout.razorpayOrderId) {
    const order = await providerRead(() => razorpay.orders.fetch(checkout.razorpayOrderId!));
    if (order.id !== checkout.razorpayOrderId || Number(order.amount) !== checkout.amountPaise || order.currency !== checkout.currency) {
      throw new Error("Provider order does not match checkout");
    }
    providerStatus = order.status;
    const payments = await providerRead(() => razorpay.orders.fetchPayments(checkout.razorpayOrderId!));
    const captured = payments.items.find((payment) => payment.status === "captured");
    if (captured) {
      assertCapturedRecoveryPayment(captured as unknown as RazorpayEntity, { amountPaise: checkout.amountPaise, currency: checkout.currency, orderId: checkout.razorpayOrderId });
      // Provider payment creation is the conservative lower bound when no invoice capture time exists.
      let paidAt = captured.created_at;
      if (captured.invoice_id) paidAt = (await providerRead(() => razorpay.invoices.fetch(captured.invoice_id!))).paid_at ?? paidAt;
      if (!Number.isSafeInteger(paidAt) || paidAt <= 0) throw new Error("Provider payment timestamp is missing");
      events.push({ event: "payment.captured", created_at: paidAt, payload: { payment: { entity: {
        id: captured.id, amount: captured.amount, currency: captured.currency, order_id: captured.order_id,
      } } } });
      action = "FULFILL";
    } else if (providerStatus === "paid") throw new Error("Paid order has no verifiable captured payment");
    else if (payments.items.some((payment) => payment.status === "authorized")) action = "KEEP";
    else action = Date.now() - checkout.createdAt.getTime() > COURSE_CHECKOUT_STALE_MS ? "CANCEL_LOCAL" : "RESUME";
    if (!dryRun) {
      for (const event of events) await applyVerifiedEvent(event);
      if (action === "CANCEL_LOCAL") await closeUnpaidCheckout(checkout.id, providerStatus);
    }
  }
  return { checkoutId: checkout.id, providerStatus, action, dryRun, verifiedPaymentIds: events.map((event) => event.payload?.payment?.entity?.id) };
}

async function applyVerifiedEvent(payload: RazorpayWebhookPayload) {
  const paymentId = payload.payload?.payment?.entity?.id;
  await processRazorpayWebhookEvent({
    eventId: `reconciliation:${payload.event}:${paymentId}`,
    eventType: payload.event, payload,
    payloadHash: hashRazorpayWebhookBody(JSON.stringify(payload)),
  });
}
