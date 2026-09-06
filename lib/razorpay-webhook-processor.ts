import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getLaterAccessEnd } from "@/lib/commerce-entitlement";
import { shouldMarkCheckoutFailed } from "@/lib/checkout-status";
import {
  confirmSessionSeatHold,
  releaseSessionSeatHold,
} from "@/lib/session-seat-inventory";
import {
  getRazorpayAmount,
  getRazorpayEntity,
  getRazorpayEventDate,
  getRazorpayNote,
  getRazorpayString,
  getRazorpayUnixDate,
  type RazorpayEntity,
  type RazorpayWebhookPayload,
} from "@/lib/razorpay-event";

const ONE_TIME_CAPTURE_EVENTS = new Set(["payment.captured"]);
const ONE_TIME_FAILURE_EVENTS = new Set(["payment.failed"]);
const REFUND_EVENTS = new Set(["refund.created", "refund.processed"]);
const SUBSCRIPTION_EVENTS = new Set([
  "subscription.authenticated",
  "subscription.activated",
  "subscription.charged",
  "subscription.completed",
  "subscription.updated",
  "subscription.pending",
  "subscription.halted",
  "subscription.paused",
  "subscription.resumed",
  "subscription.cancelled",
]);

type TransactionClient = Prisma.TransactionClient;

function parseSnapshot(snapshot: unknown): Record<string, unknown> {
  return snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
    ? snapshot as Record<string, unknown>
    : {};
}

function parseDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function subscriptionStatusForEvent(eventType: string, entity: RazorpayEntity) {
  const providerStatus = getRazorpayString(entity, "status")?.toLowerCase();
  if (eventType === "subscription.authenticated") return "AUTHENTICATED" as const;
  if (eventType === "subscription.activated" || eventType === "subscription.resumed") return "ACTIVE" as const;
  if (eventType === "subscription.charged") return "ACTIVE" as const;
  if (eventType === "subscription.completed") return "COMPLETED" as const;
  if (eventType === "subscription.pending") return "PENDING" as const;
  if (eventType === "subscription.halted") return "HALTED" as const;
  if (eventType === "subscription.paused") return "PAUSED" as const;
  if (eventType === "subscription.cancelled") return "CANCELLED" as const;

  switch (providerStatus) {
    case "authenticated": return "AUTHENTICATED" as const;
    case "active": return "ACTIVE" as const;
    case "pending": return "PENDING" as const;
    case "halted": return "HALTED" as const;
    case "paused": return "PAUSED" as const;
    case "completed": return "COMPLETED" as const;
    case "cancelled": return "CANCELLED" as const;
    default: return null;
  }
}

async function upsertEntitlement(
  tx: TransactionClient,
  input: {
    userId: string;
    resourceType: "COURSE" | "MOCK_TEST" | "MOCK_BUNDLE" | "GUIDANCE_SESSION";
    resourceId: string;
    sourceType: "RAZORPAY_PAYMENT" | "RAZORPAY_SUBSCRIPTION";
    sourceId: string;
    startsAt: Date;
    endsAt: Date | null;
    lastPaymentId: string;
  },
) {
  const existing = await tx.entitlement.findFirst({
    where: {
      userId: input.userId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
    },
  });

  if (existing) {
    return tx.entitlement.update({
      where: { id: existing.id },
      data: {
        status: "ACTIVE",
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        lastPaymentId: input.lastPaymentId,
      },
    });
  }

  return tx.entitlement.create({
    data: {
      userId: input.userId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      status: "ACTIVE",
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      lastPaymentId: input.lastPaymentId,
    },
  });
}

async function projectCourseEnrollment(
  tx: TransactionClient,
  userId: string,
  courseId: string,
  accessEndsAt: Date | null,
) {
  const enrollment = await tx.enrollment.findFirst({
    where: { userId, courseId },
    orderBy: { enrolledAt: "desc" },
  });

  if (enrollment) {
    return tx.enrollment.update({
      where: { id: enrollment.id },
      data: { expiresAt: getLaterAccessEnd(enrollment.expiresAt, accessEndsAt) },
    });
  }

  return tx.enrollment.create({
    data: { userId, courseId, expiresAt: accessEndsAt },
  });
}

async function projectSessionEnrollment(
  tx: TransactionClient,
  checkout: {
    userId: string;
    productId: string;
    razorpayOrderId: string | null;
  },
  paymentId: string,
  amountPaise: number,
  snapshot: Record<string, unknown>,
) {
  const [user, enrollment] = await Promise.all([
    tx.user.findUnique({
      where: { id: checkout.userId },
      select: { name: true, email: true, phoneNumber: true },
    }),
    tx.sessionEnrollment.findUnique({
      where: { sessionId_userId: { sessionId: checkout.productId, userId: checkout.userId } },
    }),
  ]);
  if (!user) throw new Error(`V2 session checkout ${checkout.productId} has no local user`);

  const studentPhone = typeof snapshot.studentPhone === "string" && snapshot.studentPhone.trim()
    ? snapshot.studentPhone.trim()
    : user.phoneNumber ?? "Not provided";
  const data = {
    studentName: user.name?.trim() || "Student",
    studentEmail: user.email,
    studentPhone,
    razorpayOrderId: checkout.razorpayOrderId,
    razorpayPaymentId: paymentId,
    paymentStatus: "SUCCESS" as const,
    amountPaid: amountPaise / 100,
    completedAt: new Date(),
  };

  if (enrollment) {
    return tx.sessionEnrollment.update({ where: { id: enrollment.id }, data });
  }

  return tx.sessionEnrollment.create({
    data: { sessionId: checkout.productId, userId: checkout.userId, ...data },
  });
}

async function redeemGeneralCouponReservation(
  tx: TransactionClient,
  checkout: { id: string; userId: string; productId: string; productType: "MOCK_TEST" | "MOCK_BUNDLE" | "GUIDANCE_SESSION" | "COURSE" },
  paymentId: string,
  snapshot: Record<string, unknown>,
) {
  const couponSnapshot = parseSnapshot(snapshot.coupon);
  const couponId = typeof couponSnapshot.id === "string" ? couponSnapshot.id : null;
  const productType = typeof couponSnapshot.productType === "string" ? couponSnapshot.productType : null;
  const originalAmountPaise = typeof couponSnapshot.originalAmountPaise === "number" ? couponSnapshot.originalAmountPaise : null;
  const discountPaise = typeof couponSnapshot.discountPaise === "number" ? couponSnapshot.discountPaise : null;
  const amountPaise = typeof couponSnapshot.amountPaise === "number" ? couponSnapshot.amountPaise : null;
  if (!couponId || !productType || originalAmountPaise === null || discountPaise === null || amountPaise === null) return;

  const reservation = await tx.generalCouponReservation.findUnique({ where: { checkoutId: checkout.id } });
  if (!reservation || reservation.status === "REDEEMED") return;
  if (reservation.status !== "RESERVED" || reservation.couponId !== couponId) {
    throw new Error(`V2 checkout ${checkout.id} has an invalid general coupon reservation`);
  }

  await tx.generalCouponUsage.create({
    data: {
      couponId,
      userId: checkout.userId,
      orderId: paymentId,
      productType: productType as "MOCK_BUNDLE" | "GUIDANCE_SESSION" | "INDIVIDUAL_MOCK" | "SUBSCRIPTION" | "OTHER",
      productId: checkout.productId,
      originalAmount: originalAmountPaise / 100,
      discountAmount: discountPaise / 100,
      finalAmount: amountPaise / 100,
    },
  });
  await tx.generalCouponReservation.update({
    where: { id: reservation.id },
    data: { status: "REDEEMED", redeemedAt: new Date() },
  });
  await tx.generalCoupon.update({
    where: { id: couponId },
    data: { reservedCount: { decrement: 1 }, usageCount: { increment: 1 } },
  });
}

async function releaseGeneralCouponReservation(tx: TransactionClient, checkoutId: string) {
  const reservation = await tx.generalCouponReservation.findUnique({ where: { checkoutId } });
  if (!reservation || reservation.status !== "RESERVED") return;
  await tx.generalCouponReservation.update({
    where: { id: reservation.id },
    data: { status: "RELEASED", releasedAt: new Date() },
  });
  await tx.generalCoupon.update({
    where: { id: reservation.couponId },
    data: { reservedCount: { decrement: 1 } },
  });
}

async function findCheckoutForCapturedPayment(
  tx: TransactionClient,
  payment: RazorpayEntity | null,
  orderId: string,
) {
  const checkout = await tx.commerceCheckout.findFirst({ where: { razorpayOrderId: orderId } });
  if (checkout) return checkout;

  const checkoutId = getRazorpayNote(payment, "checkout_id");
  if (!checkoutId) return null;
  const pendingCheckout = await tx.commerceCheckout.findUnique({ where: { id: checkoutId } });
  if (!pendingCheckout || pendingCheckout.checkoutType !== "ONE_TIME") return null;
  if (pendingCheckout.razorpayOrderId && pendingCheckout.razorpayOrderId !== orderId) return null;

  return tx.commerceCheckout.update({
    where: { id: pendingCheckout.id },
    data: { razorpayOrderId: orderId, status: "PROVIDER_CREATED" },
  });
}

async function findCourseSubscriptionForEvent(
  tx: TransactionClient,
  subscriptionEntity: RazorpayEntity | null,
  providerSubscriptionId: string,
) {
  const subscription = await tx.courseBillingSubscription.findUnique({
    where: { razorpaySubscriptionId: providerSubscriptionId },
  });
  if (subscription) return subscription;

  const checkoutId = getRazorpayNote(subscriptionEntity, "checkout_id");
  if (!checkoutId) return null;
  const checkout = await tx.commerceCheckout.findUnique({ where: { id: checkoutId } });
  if (!checkout || checkout.checkoutType !== "COURSE_RECURRING") return null;
  if (checkout.razorpaySubscriptionId && checkout.razorpaySubscriptionId !== providerSubscriptionId) return null;

  const pendingSubscription = await tx.courseBillingSubscription.findUnique({
    where: { razorpaySubscriptionId: `pending:${checkout.id}` },
  });
  if (!pendingSubscription) return null;

  await tx.commerceCheckout.update({
    where: { id: checkout.id },
    data: { razorpaySubscriptionId: providerSubscriptionId, status: "PROVIDER_CREATED" },
  });
  return tx.courseBillingSubscription.update({
    where: { id: pendingSubscription.id },
    data: { razorpaySubscriptionId: providerSubscriptionId },
  });
}

async function findCommerceSubscriptionForEvent(
  tx: TransactionClient,
  subscriptionEntity: RazorpayEntity | null,
  providerSubscriptionId: string,
) {
  const subscription = await tx.commerceBillingSubscription.findUnique({
    where: { razorpaySubscriptionId: providerSubscriptionId },
  });
  if (subscription) return subscription;

  const checkoutId = getRazorpayNote(subscriptionEntity, "checkout_id");
  if (!checkoutId) return null;
  const checkout = await tx.commerceCheckout.findUnique({ where: { id: checkoutId } });
  if (!checkout || checkout.checkoutType !== "RECURRING") return null;
  if (checkout.razorpaySubscriptionId && checkout.razorpaySubscriptionId !== providerSubscriptionId) return null;

  const pending = await tx.commerceBillingSubscription.findUnique({
    where: { razorpaySubscriptionId: `pending:${checkout.id}` },
  });
  if (!pending) return null;

  await tx.commerceCheckout.update({
    where: { id: checkout.id },
    data: { razorpaySubscriptionId: providerSubscriptionId, status: "PROVIDER_CREATED" },
  });
  return tx.commerceBillingSubscription.update({
    where: { id: pending.id },
    data: { razorpaySubscriptionId: providerSubscriptionId },
  });
}

async function projectGenericRecurringEntitlements(
  tx: TransactionClient,
  subscription: {
    id: string;
    userId: string;
    productType: "COURSE" | "MOCK_TEST" | "MOCK_BUNDLE" | "GUIDANCE_SESSION";
    productId: string;
    originCheckoutId: string | null;
    entitlementSnapshot: Prisma.JsonValue;
  },
  recordedPaymentId: string,
  startsAt: Date,
  endsAt: Date,
  providerPaymentId: string,
) {
  if (subscription.productType === "COURSE") {
    throw new Error(`Generic recurring subscription ${subscription.id} cannot be a course`);
  }
  const snapshot = parseSnapshot(subscription.entitlementSnapshot);
  await upsertEntitlement(tx, {
    userId: subscription.userId,
    resourceType: subscription.productType,
    resourceId: subscription.productId,
    sourceType: "RAZORPAY_SUBSCRIPTION",
    sourceId: subscription.id,
    startsAt,
    endsAt,
    lastPaymentId: recordedPaymentId,
  });

  const mockIds = Array.isArray(snapshot.mockIds)
    ? snapshot.mockIds.filter((id): id is string => typeof id === "string")
    : [];
  for (const mockId of mockIds) {
    await upsertEntitlement(tx, {
      userId: subscription.userId,
      resourceType: "MOCK_TEST",
      resourceId: mockId,
      sourceType: "RAZORPAY_SUBSCRIPTION",
      sourceId: subscription.id,
      startsAt,
      endsAt,
      lastPaymentId: recordedPaymentId,
    });
  }

  if (subscription.productType === "GUIDANCE_SESSION" && subscription.originCheckoutId) {
    const checkout = await tx.commerceCheckout.findUnique({ where: { id: subscription.originCheckoutId } });
    if (!checkout) throw new Error(`Recurring guidance subscription ${subscription.id} has no checkout`);
    const seatDecision = await confirmSessionSeatHold(tx, checkout.id, new Date());
    if (seatDecision === "REQUIRES_REVIEW") {
      await tx.commerceCheckout.update({ where: { id: checkout.id }, data: { status: "REQUIRES_REVIEW" } });
      throw new Error(`Recurring guidance subscription ${subscription.id} requires session-seat review`);
    }
    await projectSessionEnrollment(tx, checkout, providerPaymentId, 0, snapshot);
    await tx.sessionEnrollment.updateMany({
      where: { sessionId: subscription.productId, userId: subscription.userId },
      data: { billingSubscriptionId: subscription.id, accessEndsAt: endsAt, seatReleasedAt: null },
    });
  }
}

async function processCapturedPayment(
  tx: TransactionClient,
  payload: RazorpayWebhookPayload,
  eventId: string,
) {
  const payment = getRazorpayEntity(payload, "payment");
  const paymentId = getRazorpayString(payment, "id");
  const orderId = getRazorpayString(payment, "order_id");
  const amountPaise = getRazorpayAmount(payment);
  const currency = getRazorpayString(payment, "currency");
  if (!paymentId || !orderId || amountPaise === null || !currency) {
    return "Captured payment payload is missing a provider ID, order, amount, or currency";
  }

  const checkout = await findCheckoutForCapturedPayment(tx, payment, orderId);
  if (!checkout) return `No V2 checkout found for Razorpay order ${orderId}`;

  if (checkout.amountPaise !== amountPaise || checkout.currency !== currency) {
    await tx.commerceCheckout.update({
      where: { id: checkout.id },
      data: { status: "REQUIRES_REVIEW" },
    });
    return `Payment ${paymentId} amount or currency does not match checkout ${checkout.id}`;
  }

  const externalKey = `razorpay:payment:${paymentId}`;
  let recordedPayment = await tx.commercePayment.findUnique({ where: { externalKey } });
  if (!recordedPayment) {
    recordedPayment = await tx.commercePayment.create({
      data: {
        externalKey,
        providerPaymentId: paymentId,
        providerOrderId: orderId,
        checkoutId: checkout.id,
        amountPaise,
        currency,
        status: "CAPTURED",
        providerCapturedAt: getRazorpayUnixDate(payment, "created_at") ?? new Date(),
      },
    });
  }

  const snapshot = parseSnapshot(checkout.snapshot);
  const startsAt = new Date();
  const accessEndsAt = parseDate(snapshot.accessEndsAt);

  if (checkout.productType === "GUIDANCE_SESSION") {
    const seatDecision = await confirmSessionSeatHold(
      tx,
      checkout.id,
      // Payment creation can precede capture; receipt time safely enforces the hold deadline.
      new Date(),
    );
    if (seatDecision === "REQUIRES_REVIEW") {
      await tx.commerceCheckout.update({
        where: { id: checkout.id },
        data: { status: "REQUIRES_REVIEW" },
      });
      await redeemGeneralCouponReservation(tx, checkout, paymentId, snapshot);
      await tx.billingOutbox.upsert({
        where: { dedupeKey: `session-seat-review:${paymentId}` },
        update: {},
        create: {
          dedupeKey: `session-seat-review:${paymentId}`,
          action: "SESSION_SEAT_REVIEW_REQUIRED",
          payload: { eventId, checkoutId: checkout.id, paymentId },
        },
      });
      return `Captured payment ${paymentId} requires session-seat review`;
    }
  }

  await tx.commerceCheckout.update({
    where: { id: checkout.id },
    data: { status: "PAID", paidAt: new Date() },
  });

  const resourceType = checkout.productType;
  await upsertEntitlement(tx, {
    userId: checkout.userId,
    resourceType,
    resourceId: checkout.productId,
    sourceType: "RAZORPAY_PAYMENT",
    sourceId: paymentId,
    startsAt,
    endsAt: accessEndsAt,
    lastPaymentId: recordedPayment.id,
  });

  const mockIds = Array.isArray(snapshot.mockIds)
    ? snapshot.mockIds.filter((id): id is string => typeof id === "string")
    : [];
  for (const mockId of mockIds) {
    await upsertEntitlement(tx, {
      userId: checkout.userId,
      resourceType: "MOCK_TEST",
      resourceId: mockId,
      sourceType: "RAZORPAY_PAYMENT",
      sourceId: paymentId,
      startsAt,
      endsAt: accessEndsAt,
      lastPaymentId: recordedPayment.id,
    });
  }

  if (checkout.productType === "COURSE") {
    await projectCourseEnrollment(tx, checkout.userId, checkout.productId, accessEndsAt);
  }
  if (checkout.productType === "GUIDANCE_SESSION") {
    await projectSessionEnrollment(tx, checkout, paymentId, amountPaise, snapshot);
  }
  await redeemGeneralCouponReservation(tx, checkout, paymentId, snapshot);

  await tx.billingOutbox.upsert({
    where: { dedupeKey: `payment-captured:${paymentId}` },
    update: {},
    create: {
      dedupeKey: `payment-captured:${paymentId}`,
      action: "PAYMENT_CAPTURED",
      payload: { eventId, checkoutId: checkout.id, paymentId },
    },
  });

  return null;
}

async function processFailedPayment(
  tx: TransactionClient,
  payload: RazorpayWebhookPayload,
) {
  const payment = getRazorpayEntity(payload, "payment");
  const orderId = getRazorpayString(payment, "order_id");
  if (!orderId) return "Failed payment payload is missing its provider order";

  const checkout = await findCheckoutForCapturedPayment(tx, payment, orderId);
  if (!checkout) return `No V2 checkout found for failed Razorpay order ${orderId}`;

  if (shouldMarkCheckoutFailed(checkout.status)) {
    await tx.commerceCheckout.update({
      where: { id: checkout.id },
      data: { status: "FAILED" },
    });
    await releaseGeneralCouponReservation(tx, checkout.id);
    if (checkout.productType === "GUIDANCE_SESSION") {
      await releaseSessionSeatHold(tx, checkout.id, new Date());
    }
  }

  return null;
}

async function processSubscriptionEvent(
  tx: TransactionClient,
  payload: RazorpayWebhookPayload,
  eventType: string,
  eventId: string,
) {
  const subscriptionEntity = getRazorpayEntity(payload, "subscription");
  const providerSubscriptionId = getRazorpayString(subscriptionEntity, "id");
  if (!providerSubscriptionId) return "Subscription payload is missing its provider ID";

  const subscription = await findCourseSubscriptionForEvent(tx, subscriptionEntity, providerSubscriptionId);
  if (!subscription) {
    return processGenericSubscriptionEvent(tx, payload, eventType, eventId, subscriptionEntity, providerSubscriptionId);
  }

  if (!subscriptionEntity) return "Subscription payload is missing its entity";

  const eventAt = getRazorpayEventDate(payload);
  const isNewer = !subscription.lastProviderEventAt || eventAt >= subscription.lastProviderEventAt;
  const nextStatus = subscriptionStatusForEvent(eventType, subscriptionEntity);
  const currentPeriodStart = getRazorpayUnixDate(subscriptionEntity, "current_start");
  const currentPeriodEnd = getRazorpayUnixDate(subscriptionEntity, "current_end");
  const nextChargeAt = getRazorpayUnixDate(subscriptionEntity, "charge_at");

  if (isNewer) {
    await tx.courseBillingSubscription.update({
      where: { id: subscription.id },
      data: {
        ...(nextStatus ? { providerStatus: nextStatus } : {}),
        ...(currentPeriodStart ? { currentPeriodStart } : {}),
        ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
        ...(nextChargeAt ? { nextChargeAt } : {}),
        ...(eventType === "subscription.cancelled" ? { cancelledAt: eventAt } : {}),
        lastProviderEventAt: eventAt,
      },
    });
  }

  if (eventType !== "subscription.charged") return null;

  const payment = getRazorpayEntity(payload, "payment");
  const paymentId = getRazorpayString(payment, "id");
  const amountPaise = getRazorpayAmount(payment);
  const currency = getRazorpayString(payment, "currency") ?? "INR";
  if (!paymentId || amountPaise === null || !currentPeriodEnd) {
    return `Charged subscription ${providerSubscriptionId} has incomplete payment or period data`;
  }

  const plan = await tx.courseBillingPlan.findUnique({ where: { id: subscription.billingPlanId } });
  if (!plan || plan.amountPaise !== amountPaise || plan.currency !== currency) {
    return `Charged subscription ${providerSubscriptionId} does not match its local plan`;
  }

  const externalKey = `razorpay:payment:${paymentId}`;
  let recordedPayment = await tx.commercePayment.findUnique({ where: { externalKey } });
  if (!recordedPayment) {
    recordedPayment = await tx.commercePayment.create({
      data: {
        externalKey,
        providerPaymentId: paymentId,
        providerSubscriptionId,
        amountPaise,
        currency,
        status: "CAPTURED",
        providerCapturedAt: getRazorpayUnixDate(payment, "created_at") ?? new Date(),
      },
    });
  }

  await upsertEntitlement(tx, {
    userId: subscription.userId,
    resourceType: "COURSE",
    resourceId: subscription.courseId,
    sourceType: "RAZORPAY_SUBSCRIPTION",
    sourceId: subscription.id,
    startsAt: currentPeriodStart ?? new Date(),
    endsAt: currentPeriodEnd,
    lastPaymentId: recordedPayment.id,
  });
  await projectCourseEnrollment(tx, subscription.userId, subscription.courseId, currentPeriodEnd);

  await tx.billingOutbox.upsert({
    where: { dedupeKey: `subscription-charged:${paymentId}` },
    update: {},
    create: {
      dedupeKey: `subscription-charged:${paymentId}`,
      action: "SUBSCRIPTION_CHARGED",
      payload: { eventId, subscriptionId: subscription.id, paymentId },
    },
  });

  return null;
}

async function processGenericSubscriptionEvent(
  tx: TransactionClient,
  payload: RazorpayWebhookPayload,
  eventType: string,
  eventId: string,
  subscriptionEntity: RazorpayEntity | null,
  providerSubscriptionId: string,
) {
  const subscription = await findCommerceSubscriptionForEvent(tx, subscriptionEntity, providerSubscriptionId);
  if (!subscription) return `No V2 recurring subscription found for ${providerSubscriptionId}`;
  if (!subscriptionEntity) return "Subscription payload is missing its entity";

  const eventAt = getRazorpayEventDate(payload);
  const isNewer = !subscription.lastProviderEventAt || eventAt >= subscription.lastProviderEventAt;
  const nextStatus = subscriptionStatusForEvent(eventType, subscriptionEntity);
  const currentPeriodStart = getRazorpayUnixDate(subscriptionEntity, "current_start");
  const currentPeriodEnd = getRazorpayUnixDate(subscriptionEntity, "current_end");
  const nextChargeAt = getRazorpayUnixDate(subscriptionEntity, "charge_at");
  if (isNewer) {
    await tx.commerceBillingSubscription.update({
      where: { id: subscription.id },
      data: {
        ...(nextStatus ? { providerStatus: nextStatus } : {}),
        ...(currentPeriodStart ? { currentPeriodStart } : {}),
        ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
        ...(nextChargeAt ? { nextChargeAt } : {}),
        ...(eventType === "subscription.cancelled" ? { cancelledAt: eventAt } : {}),
        lastProviderEventAt: eventAt,
      },
    });
  }
  if (eventType !== "subscription.charged") return null;

  const payment = getRazorpayEntity(payload, "payment");
  const paymentId = getRazorpayString(payment, "id");
  const amountPaise = getRazorpayAmount(payment);
  const currency = getRazorpayString(payment, "currency") ?? "INR";
  if (!paymentId || amountPaise === null || !currentPeriodEnd) {
    return `Charged subscription ${providerSubscriptionId} has incomplete payment or period data`;
  }
  const plan = await tx.commerceBillingPlan.findUnique({ where: { id: subscription.billingPlanId } });
  if (!plan || plan.amountPaise !== amountPaise || plan.currency !== currency) {
    return `Charged subscription ${providerSubscriptionId} does not match its local plan`;
  }

  const externalKey = `razorpay:payment:${paymentId}`;
  let recordedPayment = await tx.commercePayment.findUnique({ where: { externalKey } });
  if (!recordedPayment) {
    recordedPayment = await tx.commercePayment.create({
      data: {
        externalKey,
        providerPaymentId: paymentId,
        providerSubscriptionId,
        checkoutId: subscription.originCheckoutId,
        amountPaise,
        currency,
        status: "CAPTURED",
        providerCapturedAt: getRazorpayUnixDate(payment, "created_at") ?? new Date(),
      },
    });
  }

  await projectGenericRecurringEntitlements(
    tx,
    subscription,
    recordedPayment.id,
    currentPeriodStart ?? new Date(),
    currentPeriodEnd,
    paymentId,
  );
  if (subscription.originCheckoutId) {
    await tx.commerceCheckout.update({
      where: { id: subscription.originCheckoutId },
      data: { status: "PAID", paidAt: new Date() },
    });
  }
  await tx.billingOutbox.upsert({
    where: { dedupeKey: `subscription-charged:${paymentId}` },
    update: {},
    create: {
      dedupeKey: `subscription-charged:${paymentId}`,
      action: "SUBSCRIPTION_CHARGED",
      payload: { eventId, subscriptionId: subscription.id, paymentId },
    },
  });
  return null;
}

async function processRefundEvent(
  tx: TransactionClient,
  payload: RazorpayWebhookPayload,
  eventType: string,
  eventId: string,
) {
  const refund = getRazorpayEntity(payload, "refund");
  const refundId = getRazorpayString(refund, "id");
  const paymentId = getRazorpayString(refund, "payment_id");
  const amountPaise = getRazorpayAmount(refund);
  const currency = getRazorpayString(refund, "currency") ?? "INR";
  if (!refundId || !paymentId || amountPaise === null) return "Refund payload is incomplete";

  const payment = await tx.commercePayment.findFirst({ where: { providerPaymentId: paymentId } });
  if (!payment) return `No V2 payment found for refund ${refundId}`;

  await tx.commerceRefund.upsert({
    where: { externalKey: `razorpay:refund:${refundId}` },
    update: {
      status: eventType === "refund.processed" ? "PROCESSED" : "CREATED",
      processedAt: eventType === "refund.processed" ? new Date() : undefined,
    },
    create: {
      externalKey: `razorpay:refund:${refundId}`,
      providerRefundId: refundId,
      providerPaymentId: paymentId,
      amountPaise,
      currency,
      status: eventType === "refund.processed" ? "PROCESSED" : "CREATED",
      processedAt: eventType === "refund.processed" ? new Date() : null,
    },
  });

  if (eventType === "refund.processed" && amountPaise >= payment.amountPaise) {
    await tx.commercePayment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
  }

  await tx.billingOutbox.upsert({
    where: { dedupeKey: `refund:${refundId}:${eventType}` },
    update: {},
    create: {
      dedupeKey: `refund:${refundId}:${eventType}`,
      action: "REFUND_REVIEW_REQUIRED",
      payload: { eventId, paymentId, refundId },
    },
  });

  return null;
}

export async function processRazorpayWebhookEvent(input: {
  eventId: string;
  eventType: string;
  payload: RazorpayWebhookPayload;
  payloadHash: string;
}) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.razorpayWebhookEvent.create({
        data: {
          providerEventId: input.eventId,
          eventType: input.eventType,
          payloadHash: input.payloadHash,
        },
      });

      let processingError: string | null = null;
      if (ONE_TIME_CAPTURE_EVENTS.has(input.eventType)) {
        processingError = await processCapturedPayment(tx, input.payload, input.eventId);
      } else if (ONE_TIME_FAILURE_EVENTS.has(input.eventType)) {
        processingError = await processFailedPayment(tx, input.payload);
      } else if (SUBSCRIPTION_EVENTS.has(input.eventType)) {
        processingError = await processSubscriptionEvent(tx, input.payload, input.eventType, input.eventId);
      } else if (REFUND_EVENTS.has(input.eventType)) {
        processingError = await processRefundEvent(tx, input.payload, input.eventType, input.eventId);
      }

      await tx.razorpayWebhookEvent.update({
        where: { providerEventId: input.eventId },
        data: {
          status: processingError ? "IGNORED" : "PROCESSED",
          processingError,
          processedAt: new Date(),
        },
      });
    });

    return { duplicate: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { duplicate: true };
    }
    throw error;
  }
}
