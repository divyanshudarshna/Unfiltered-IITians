import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { razorpayAdminRequest } from "./razorpay-admin";
import { releaseConfirmedSessionSeat, releaseSessionSeatHold } from "./session-seat-inventory";

const REFUND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const LEASE_MS = 90_000;
type ProviderEntity = Record<string, unknown>;
type ActionInput = {
  userId: string; courseId: string; actorId: string; action: "TERMINATE" | "TERMINATE_REFUND";
  paymentId?: string; reason: string; requestId: string;
};
type Scope = { checkoutIds: string[]; subscriptionIds: string[]; legacyIds: string[]; paymentIds: string[] };
type ActionResult = { pending: boolean; accessTerminated: boolean; refundStatus: string | null; refundId: string | null; operationId: string; message: string };
type ActionRecord = ActionInput & { scope: Scope; localTerminated: boolean; result?: ActionResult };
type RefundRecord = { paymentId: string; amountPaise: number; currency: string; actorId: string; reason: string; refundId?: string; refundStatus?: string };
type Payment = { paymentId: string; amountPaise: number; currency: string; status: string; capturedAt: Date | null; orderId: string | null; subscriptionId: string | null };

export class AdminCourseActionError extends Error {
  constructor(message: string, public status = 409) { super(message); this.name = "AdminCourseActionError"; }
}
function json(value: ActionRecord | RefundRecord | Record<string, string>) { return value as unknown as Prisma.InputJsonValue; }
function isWithinRefundWindow(capturedAt: Date | null, now: Date) {
  return Boolean(capturedAt && capturedAt <= now && now.getTime() - capturedAt.getTime() <= REFUND_WINDOW_MS);
}

async function loadContext(userId: string, courseId: string) {
  const [user, course, enrollments, checkouts, subscriptions, legacy] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } }),
    prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true } }),
    prisma.enrollment.findMany({ where: { userId, courseId } }),
    prisma.commerceCheckout.findMany({ where: { userId, productType: "COURSE", productId: courseId } }),
    prisma.courseBillingSubscription.findMany({ where: { userId, courseId }, include: { billingPlan: true } }),
    prisma.subscription.findMany({ where: { userId, courseId } }),
  ]);
  if (!user || !course || (!enrollments.length && !checkouts.length && !legacy.length && !subscriptions.length)) {
    throw new AdminCourseActionError("Course enrollment or checkout not found", 404);
  }
  const v2Payments = await prisma.commercePayment.findMany({ where: { OR: [
    { checkoutId: { in: checkouts.map(row => row.id) } },
    { providerSubscriptionId: { in: subscriptions.map(row => row.razorpaySubscriptionId) } },
  ] }, orderBy: { providerCapturedAt: "desc" } });
  const payments: Payment[] = v2Payments.filter(row => row.providerPaymentId).map(row => ({
    paymentId: row.providerPaymentId!, amountPaise: row.amountPaise, currency: row.currency, status: row.status,
    capturedAt: row.providerCapturedAt, orderId: row.providerOrderId, subscriptionId: row.providerSubscriptionId,
  }));
  const knownIds = new Set(payments.map(row => row.paymentId));
  for (const row of legacy) {
    if (!row.paid || !row.razorpayPaymentId || knownIds.has(row.razorpayPaymentId)) continue;
    payments.push({ paymentId: row.razorpayPaymentId, amountPaise: row.actualAmountPaid ?? 0, currency: "INR", status: "CAPTURED", capturedAt: row.paidAt, orderId: row.razorpayOrderId, subscriptionId: null });
  }
  payments.sort((a, b) => (b.capturedAt?.getTime() ?? 0) - (a.capturedAt?.getTime() ?? 0));
  return { user, course, enrollments, checkouts, subscriptions, legacy, payments };
}

export async function getAdminCourseBilling(userId: string, courseId: string, now = new Date(), actorId?: string) {
  const context = await loadContext(userId, courseId);
  const refunds = await prisma.commerceRefund.findMany({ where: { providerPaymentId: { in: context.payments.map(row => row.paymentId) } } });
  const jobs = actorId ? await prisma.billingOutbox.findMany({ where: { action: "ADMIN_COURSE_ACTION", status: { in: ["FAILED", "PROCESSING"] } }, orderBy: { updatedAt: "desc" }, take: 200 }) : [];
  const pending = jobs.map(job => job.payload as unknown as ActionRecord).find(row => row.userId === userId && row.courseId === courseId && row.actorId === actorId);
  return {
    user: context.user, course: context.course,
    pendingAction: pending ? { userId, courseId, action: pending.action, paymentId: pending.paymentId, reason: pending.reason, requestId: pending.requestId, confirmation: "TERMINATE" } : null,
    payments: context.payments.map(row => ({
      paymentId: row.paymentId, amountPaise: row.amountPaise, currency: row.currency, status: row.status,
      capturedAt: row.capturedAt, refundDeadline: row.capturedAt ? new Date(row.capturedAt.getTime() + REFUND_WINDOW_MS) : null,
      refunds: refunds.filter(refund => refund.providerPaymentId === row.paymentId).map(refund => ({ id: refund.providerRefundId, status: refund.status, amountPaise: refund.amountPaise })),
      refundEligible: row.status === "CAPTURED" && row.amountPaise > 0 && isWithinRefundWindow(row.capturedAt, now)
        && !refunds.some(refund => refund.providerPaymentId === row.paymentId && refund.status !== "FAILED"),
    })),
    subscriptions: context.subscriptions.map(row => ({ id: row.id, providerStatus: row.providerStatus, providerSubscriptionId: row.razorpaySubscriptionId })),
  };
}

async function verifyPayment(payment: Payment, now: Date, existingRefund: RefundRecord | null) {
  const retryingRefund = existingRefund?.paymentId === payment.paymentId && existingRefund.amountPaise === payment.amountPaise && existingRefund.currency === payment.currency;
  if (!Number.isSafeInteger(payment.amountPaise) || payment.amountPaise <= 0 || (payment.status !== "CAPTURED" && !retryingRefund)) {
    throw new AdminCourseActionError("Only an owned captured payment can be refunded");
  }
  const provider = await razorpayAdminRequest<ProviderEntity>("GET", `/payments/${encodeURIComponent(payment.paymentId)}`);
  if (provider.id !== payment.paymentId || provider.order_id !== payment.orderId || provider.amount !== payment.amountPaise || provider.currency !== payment.currency) {
    throw new AdminCourseActionError("Razorpay payment does not match this course purchase");
  }
  if (provider.status !== "captured" && !(retryingRefund && provider.status === "refunded")) throw new AdminCourseActionError("Only a verified captured payment can be refunded");
  if (!retryingRefund && Number(provider.amount_refunded ?? 0) !== 0) throw new AdminCourseActionError("This payment already has a full or partial refund; no additional full refund was issued");
  let capturedAt = payment.capturedAt;
  if (payment.subscriptionId) {
    let invoice: ProviderEntity | undefined;
    if (typeof provider.invoice_id === "string") {
      invoice = await razorpayAdminRequest<ProviderEntity>("GET", `/invoices/${encodeURIComponent(provider.invoice_id)}`);
    } else {
      const list = await razorpayAdminRequest<ProviderEntity>("GET", `/invoices?subscription_id=${encodeURIComponent(payment.subscriptionId)}&count=100`);
      invoice = (list.items as ProviderEntity[] | undefined)?.find(row => row.payment_id === payment.paymentId);
    }
    if (!invoice || invoice.status !== "paid" || invoice.subscription_id !== payment.subscriptionId || invoice.payment_id !== payment.paymentId
      || invoice.order_id !== payment.orderId || invoice.amount_paid !== payment.amountPaise || invoice.currency !== payment.currency
      || !Number.isSafeInteger(invoice.paid_at)) throw new AdminCourseActionError("Unable to verify this payment's owned subscription invoice");
    capturedAt = new Date(Number(invoice.paid_at) * 1000);
  } else {
    // Legacy callback verification time is not proof of capture time. In the
    // absence of a paid invoice, use the conservative provider creation date.
    if (!Number.isSafeInteger(provider.created_at)) throw new AdminCourseActionError("Payment timestamp could not be verified");
    const providerDate = new Date(Number(provider.created_at) * 1000);
    if (!capturedAt || providerDate < capturedAt) capturedAt = providerDate;
  }
  if (!retryingRefund && !isWithinRefundWindow(capturedAt, now)) throw new AdminCourseActionError("Refunds are available only within the 7-day window after payment");
}

async function terminateLocalAccess(record: ActionRecord, operationId: string, now: Date) {
  const expiredAt = new Date(now.getTime() - 1);
  const { userId, courseId } = record;
  const { checkoutIds, subscriptionIds, legacyIds } = record.scope;
  const paymentIds = record.scope.paymentIds;
  const sources: Prisma.EntitlementWhereInput[] = [
    { sourceType: "RAZORPAY_SUBSCRIPTION", sourceId: { in: subscriptionIds } },
    { sourceType: "RAZORPAY_PAYMENT", sourceId: { in: paymentIds } },
  ];
  await prisma.$transaction(async tx => {
    for (const subscriptionId of subscriptionIds) await tx.billingOutbox.upsert({
      where: { dedupeKey: `course-subscription-terminated:${subscriptionId}` }, update: {},
      create: { dedupeKey: `course-subscription-terminated:${subscriptionId}`, action: "COURSE_ACCESS_TERMINATED", status: "SENT", payload: json({ actorId: record.actorId, userId, courseId, operationId, reason: record.reason }) },
    });
    for (const legacyId of legacyIds) await tx.billingOutbox.upsert({
      where: { dedupeKey: `legacy-course-access-terminated:${legacyId}` }, update: {},
      create: { dedupeKey: `legacy-course-access-terminated:${legacyId}`, action: "COURSE_ACCESS_TERMINATED", status: "SENT", payload: json({ actorId: record.actorId, userId, courseId, operationId, reason: record.reason }) },
    });
    for (const checkoutId of checkoutIds) await tx.billingOutbox.upsert({
      where: { dedupeKey: `course-access-terminated:${checkoutId}` }, update: {},
      create: { dedupeKey: `course-access-terminated:${checkoutId}`, action: "COURSE_ACCESS_TERMINATED", status: "SENT", payload: json({ actorId: record.actorId, userId, courseId, operationId, reason: record.reason }) },
    });
    // Expire rather than delete: payment receipts and the admin audit remain.
    // Touch the mandate in this transaction too, fencing concurrent charge
    // fulfillment for orphan subscriptions that have no checkout document.
    await tx.courseBillingSubscription.updateMany({ where: { id: { in: subscriptionIds }, userId }, data: { updatedAt: now } });
    await tx.commerceCheckout.updateMany({ where: { id: { in: checkoutIds }, userId }, data: { status: "CANCELLED" } });
    await tx.enrollment.updateMany({ where: { userId, courseId }, data: { expiresAt: expiredAt } });
    await tx.entitlement.updateMany({ where: { userId, OR: [{ resourceType: "COURSE", resourceId: courseId }, ...sources] }, data: { status: "REVOKED", endsAt: expiredAt } });
    await tx.subscription.updateMany({ where: { id: { in: legacyIds }, userId }, data: { expiresAt: expiredAt } });
    const legacyInclusions = legacyIds.flatMap(id => [
      { razorpayOrderId: { startsWith: `inclusion_mock_${id}_` } },
      { razorpayOrderId: { startsWith: `inclusion_bundle_${id}_` } },
      { razorpayOrderId: { startsWith: `inclusion_bundle_mock_${id}_` } },
    ]);
    if (legacyInclusions.length) await tx.subscription.updateMany({ where: { userId, OR: legacyInclusions }, data: { expiresAt: expiredAt } });
    const sessions = await tx.sessionEnrollment.findMany({ where: { userId, OR: [
      { sourceCheckoutId: { in: checkoutIds } },
      ...legacyIds.map(id => ({ razorpayOrderId: { startsWith: `course_inclusion_session_${id}_` } })),
    ] } });
    for (const session of sessions) {
      const otherAccess = await tx.entitlement.findFirst({ where: {
        userId, resourceType: "GUIDANCE_SESSION", resourceId: session.sessionId, status: "ACTIVE", startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      } });
      if (otherAccess) continue;
      await tx.sessionEnrollment.updateMany({ where: { id: session.id, userId }, data: { accessEndsAt: expiredAt, seatReleasedAt: now } });
      if (session.sourceCheckoutId) await releaseConfirmedSessionSeat(tx, { checkoutId: session.sourceCheckoutId, now, sessionId: session.sessionId });
    }
    for (const checkoutId of checkoutIds) await releaseSessionSeatHold(tx, checkoutId, now);
    await tx.commerceSubscriptionSlot.deleteMany({ where: { checkoutId: { in: checkoutIds }, userId } });
    await tx.billingOutbox.update({ where: { id: operationId }, data: { payload: json({ ...record, localTerminated: true }) } });
  }, { maxWait: 5000, timeout: 20_000 });
  record.localTerminated = true;
}

async function issueRefund(payment: Payment, input: ActionInput, now: Date) {
  const dedupeKey = `course-full-refund:${payment.paymentId}`;
  let job = await prisma.billingOutbox.findUnique({ where: { dedupeKey } });
  if (!job) {
    const payload: RefundRecord = { paymentId: payment.paymentId, amountPaise: payment.amountPaise, currency: payment.currency, actorId: input.actorId, reason: input.reason };
    try { job = await prisma.billingOutbox.create({ data: { dedupeKey, action: "COURSE_FULL_REFUND", status: "PROCESSING", payload: json(payload) } }); }
    catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === "P2002")) throw error;
      job = await prisma.billingOutbox.findUnique({ where: { dedupeKey } });
    }
  }
  if (!job) throw new Error("Refund intent could not be recorded");
  const stored = job.payload as unknown as RefundRecord;
  if (stored.paymentId !== payment.paymentId || stored.amountPaise !== payment.amountPaise || stored.currency !== payment.currency) throw new Error("Refund intent does not match the verified payment");
  if (job.status === "SENT" && stored.refundId) return { refundId: stored.refundId, refundStatus: stored.refundStatus ?? "CREATED" };
  // Deterministic across all admins, double clicks, network failures and jobs.
  // https://razorpay.com/docs/api/refunds/normal-refunds-idempotent
  const key = `course-full-refund-${payment.paymentId}`;
  const refund = await razorpayAdminRequest<ProviderEntity>("POST", `/payments/${encodeURIComponent(payment.paymentId)}/refund`, { amount: stored.amountPaise, speed: "normal" }, key);
  if (typeof refund.id !== "string" || refund.payment_id !== payment.paymentId || refund.amount !== stored.amountPaise || refund.currency !== stored.currency
    || !["processed", "pending", "created"].includes(String(refund.status))) throw new Error("Razorpay has not confirmed a successful refund request; verify and retry this same action");
  const refundStatus = refund.status === "processed" ? "PROCESSED" : "CREATED";
  const refundId = refund.id;
  await prisma.$transaction(async tx => {
    const existing = await tx.commerceRefund.findUnique({ where: { externalKey: `razorpay:refund:${refundId}` } });
    const status = existing?.status === "PROCESSED" ? "PROCESSED" : refundStatus;
    await tx.commerceRefund.upsert({ where: { externalKey: `razorpay:refund:${refundId}` },
      update: { status, ...(status === "PROCESSED" ? { processedAt: now } : {}) },
      create: { externalKey: `razorpay:refund:${refundId}`, providerRefundId: refundId, providerPaymentId: payment.paymentId, amountPaise: stored.amountPaise, currency: stored.currency, status, reason: stored.reason, ...(status === "PROCESSED" ? { processedAt: now } : {}) },
    });
    if (status === "PROCESSED") await tx.commercePayment.updateMany({ where: { providerPaymentId: payment.paymentId }, data: { status: "REFUNDED" } });
    await tx.billingOutbox.update({ where: { id: job.id }, data: { status: "SENT", lastError: null, payload: json({ ...stored, refundId, refundStatus: status }) } });
  });
  return { refundId, refundStatus };
}

export async function executeAdminCourseAction(input: ActionInput, now = new Date()): Promise<ActionResult> {
  const dedupeKey = `admin-course-action:${input.requestId}`;
  const existing = await prisma.billingOutbox.findUnique({ where: { dedupeKey } });
  const stored = existing?.payload as unknown as ActionRecord | undefined;
  if (stored && (stored.userId !== input.userId || stored.courseId !== input.courseId || stored.actorId !== input.actorId
    || stored.action !== input.action || stored.paymentId !== input.paymentId || stored.reason !== input.reason)) throw new AdminCourseActionError("This request ID was already used for a different action");
  if (existing?.status === "SENT" && stored?.result) return stored.result;
  if (existing?.status === "PROCESSING" && existing.nextAttemptAt && existing.nextAttemptAt > now) throw new AdminCourseActionError("This action is already running. Wait before retrying the same action.");
  const context = await loadContext(input.userId, input.courseId);
  const scope: Scope = stored?.scope ?? { checkoutIds: context.checkouts.map(row => row.id), subscriptionIds: context.subscriptions.map(row => row.id), legacyIds: context.legacy.map(row => row.id), paymentIds: context.payments.map(row => row.paymentId) };
  const subscriptions = context.subscriptions.filter(row => scope.subscriptionIds.includes(row.id));
  if (subscriptions.some(row => row.razorpaySubscriptionId.startsWith("pending:"))) throw new AdminCourseActionError("A subscription is still being created. Wait and retry before terminating its billing.");
  const payment = input.action === "TERMINATE_REFUND" ? context.payments.find(row => row.paymentId === input.paymentId) : undefined;
  if (input.action === "TERMINATE_REFUND" && !payment) throw new AdminCourseActionError("Selected payment does not belong to this course enrollment", 404);
  if (payment) {
    const refundJob = await prisma.billingOutbox.findUnique({ where: { dedupeKey: `course-full-refund:${payment.paymentId}` } });
    // An approved action can be safely completed after its original deadline;
    // this does not authorize a new refund outside the seven-day window.
    await verifyPayment(payment, existing?.createdAt ?? now, refundJob ? refundJob.payload as unknown as RefundRecord : null);
  }
  // Verify every owned mandate BEFORE changing local access or issuing money.
  const providers = await Promise.all(subscriptions.map(async row => {
    const provider = await razorpayAdminRequest<ProviderEntity>("GET", `/subscriptions/${encodeURIComponent(row.razorpaySubscriptionId)}`);
    if (provider.id !== row.razorpaySubscriptionId || provider.plan_id !== row.billingPlan.razorpayPlanId) throw new AdminCourseActionError("Razorpay subscription does not match this course billing plan");
    return { row, provider };
  }));
  const record: ActionRecord = stored ?? { ...input, scope, localTerminated: false };
  let operation;
  if (existing) {
    const claimed = await prisma.billingOutbox.updateMany({ where: { id: existing.id, status: existing.status, OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] }, data: { status: "PROCESSING", nextAttemptAt: new Date(now.getTime() + LEASE_MS), lastError: null } });
    if (!claimed.count) throw new AdminCourseActionError("This action is already running");
    operation = existing;
  } else {
    try { operation = await prisma.billingOutbox.create({ data: { dedupeKey, action: "ADMIN_COURSE_ACTION", status: "PROCESSING", payload: json(record), nextAttemptAt: new Date(now.getTime() + LEASE_MS) } }); }
    catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") throw new AdminCourseActionError("This action is already running");
      throw error;
    }
  }
  try {
    if (!record.localTerminated) await terminateLocalAccess(record, operation.id, now);
    for (const { row, provider } of providers) {
      const terminal = ["cancelled", "completed", "expired"].includes(String(provider.status));
      const cancelled = terminal ? provider : await razorpayAdminRequest<ProviderEntity>("POST", `/subscriptions/${encodeURIComponent(row.razorpaySubscriptionId)}/cancel`, { cancel_at_cycle_end: 0 });
      if (cancelled.id !== row.razorpaySubscriptionId || !["cancelled", "completed", "expired"].includes(String(cancelled.status))) throw new Error("Future charges have not yet been confirmed stopped. Retry the same action.");
      await prisma.courseBillingSubscription.updateMany({ where: { id: row.id, userId: input.userId }, data: { providerStatus: cancelled.status === "completed" ? "COMPLETED" : "CANCELLED", cancelledAt: now, cancelAtPeriodEnd: false, nextChargeAt: null, lastProviderEventAt: now } });
    }
    const refund = payment ? await issueRefund(payment, input, now) : { refundStatus: null, refundId: null };
    const result: ActionResult = { pending: false, accessTerminated: true, ...refund, operationId: operation.id,
      message: payment ? refund.refundStatus === "PROCESSED" ? "Access terminated, future billing stopped, and refund processed." : "Access terminated and future billing stopped. Razorpay has accepted the refund; processing is pending." : "Access terminated and future billing stopped. No refund was issued." };
    record.result = result;
    await prisma.billingOutbox.update({ where: { id: operation.id }, data: { status: "SENT", nextAttemptAt: null, lastError: null, payload: json(record) } });
    return result;
  } catch {
    const result: ActionResult = { pending: true, accessTerminated: record.localTerminated, refundStatus: null, refundId: null, operationId: operation.id,
      message: record.localTerminated ? "Access is terminated. Billing cancellation or refund is not yet confirmed. Retry this same action; do not create a new request." : "This action is not yet confirmed. Retry this same action." };
    record.result = result;
    await prisma.billingOutbox.update({ where: { id: operation.id }, data: { status: "FAILED", nextAttemptAt: null, lastError: result.message, payload: json(record) } });
    return result;
  }
}
