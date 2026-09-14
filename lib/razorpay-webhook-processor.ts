import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getEarlierAccessStart, getLaterAccessEnd } from "@/lib/commerce-entitlement";
import { classifyWebhookProcessingError } from "@/lib/webhook-processing";
import {
  getCapturedCourseAccessWindow,
  getGuidanceAccessEnd,
  getRecurringAccessStart,
} from "@/lib/purchase-access-window";
import {
  confirmSessionSeatHold,
  confirmSessionSeatHolds,
  releaseSessionSeatHold,
} from "@/lib/session-seat-inventory";
import {
  getRazorpayAmount,
  getRazorpayEntity,
  getRazorpayEventDate,
  getRazorpayNote,
  getRazorpayString,
  getRazorpayUnixDate,
  getRazorpayWebhookCreatedAt,
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
        startsAt: getEarlierAccessStart(existing.startsAt, input.startsAt),
        endsAt: getLaterAccessEnd(existing.endsAt, input.endsAt),
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
  accessStartsAt: Date,
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
    data: { userId, courseId, enrolledAt: accessStartsAt, expiresAt: accessEndsAt },
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
  accessEndsAt?: Date,
  sourceCheckoutId?: string,
  accessStartsAt?: Date,
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
  const shouldResetEnrollmentStart = Boolean(
    accessStartsAt
    && sourceCheckoutId
    && enrollment?.sourceCheckoutId !== sourceCheckoutId,
  );
  const data = {
    studentName: user.name?.trim() || "Student",
    studentEmail: user.email,
    studentPhone,
    razorpayOrderId: checkout.razorpayOrderId,
    razorpayPaymentId: paymentId,
    paymentStatus: "SUCCESS" as const,
    amountPaid: amountPaise / 100,
    completedAt: accessStartsAt ?? new Date(),
    ...(accessEndsAt
      ? { accessEndsAt: getLaterAccessEnd(enrollment?.accessEndsAt, accessEndsAt), seatReleasedAt: null }
      : {}),
    ...(sourceCheckoutId ? { sourceCheckoutId } : {}),
    ...(shouldResetEnrollmentStart ? { enrolledAt: accessStartsAt } : {}),
  };

  if (enrollment) {
    return tx.sessionEnrollment.update({ where: { id: enrollment.id }, data });
  }

  return tx.sessionEnrollment.create({
    data: {
      sessionId: checkout.productId,
      userId: checkout.userId,
      ...data,
      ...(accessStartsAt ? { enrolledAt: accessStartsAt } : {}),
    },
  });
}

async function projectCourseInclusions(
  tx: TransactionClient,
  input: {
    userId: string;
    checkoutId: string | null;
    snapshot: Record<string, unknown>;
    sourceType: "RAZORPAY_PAYMENT" | "RAZORPAY_SUBSCRIPTION";
    sourceId: string;
    startsAt: Date;
    endsAt: Date | null;
    recordedPaymentId: string;
    providerPaymentId: string;
  },
) {
  const includedMockIds = Array.isArray(input.snapshot.includedMockIds)
    ? input.snapshot.includedMockIds.filter((id): id is string => typeof id === "string")
    : [];
  const includedBundleIds = Array.isArray(input.snapshot.includedBundleIds)
    ? input.snapshot.includedBundleIds.filter((id): id is string => typeof id === "string")
    : [];
  const includedSessions = Array.isArray(input.snapshot.includedSessions)
    ? input.snapshot.includedSessions.flatMap((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return [];
      const id = (value as Record<string, unknown>).id;
      return typeof id === "string" ? [id] : [];
    })
    : [];

  if (includedSessions.length > 0 && !input.checkoutId) {
    throw new Error(`Course inclusion source ${input.sourceId} has sessions but no checkout`);
  }

  const capturedAt = new Date();
  const reviewedSessionId = includedSessions.length > 0
    ? await confirmSessionSeatHolds(tx, input.checkoutId!, includedSessions, capturedAt)
    : null;
  if (reviewedSessionId) return reviewedSessionId;

  for (const mockId of includedMockIds) {
    await upsertEntitlement(tx, {
      userId: input.userId,
      resourceType: "MOCK_TEST",
      resourceId: mockId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      lastPaymentId: input.recordedPaymentId,
    });
  }
  for (const bundleId of includedBundleIds) {
    await upsertEntitlement(tx, {
      userId: input.userId,
      resourceType: "MOCK_BUNDLE",
      resourceId: bundleId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      lastPaymentId: input.recordedPaymentId,
    });
  }
  for (const sessionId of includedSessions) {
    await upsertEntitlement(tx, {
      userId: input.userId,
      resourceType: "GUIDANCE_SESSION",
      resourceId: sessionId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      lastPaymentId: input.recordedPaymentId,
    });
    await projectSessionEnrollment(
      tx,
      { userId: input.userId, productId: sessionId, razorpayOrderId: null },
      input.providerPaymentId,
      0,
      { studentPhone: "Included with course" },
      input.endsAt ?? undefined,
      input.checkoutId ?? undefined,
      input.startsAt,
    );
  }

  return null;
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
  amountPaise: number,
) {
  if (subscription.productType === "COURSE") {
    throw new Error(`Generic recurring subscription ${subscription.id} cannot be a course`);
  }
  const snapshot = parseSnapshot(subscription.entitlementSnapshot);
  const guidanceCheckout = subscription.productType === "GUIDANCE_SESSION" && subscription.originCheckoutId
    ? await tx.commerceCheckout.findUnique({ where: { id: subscription.originCheckoutId } })
    : null;
  if (subscription.productType === "GUIDANCE_SESSION") {
    if (!guidanceCheckout) throw new Error(`Recurring guidance subscription ${subscription.id} has no checkout`);
    const seatDecision = await confirmSessionSeatHold(tx, guidanceCheckout.id, new Date());
    if (seatDecision === "REQUIRES_REVIEW") return guidanceCheckout.id;
  }

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

  if (subscription.productType === "GUIDANCE_SESSION" && guidanceCheckout) {
    await projectSessionEnrollment(
      tx,
      guidanceCheckout,
      providerPaymentId,
      amountPaise,
      snapshot,
      endsAt,
      subscription.originCheckoutId ?? undefined,
      startsAt,
    );
    await tx.sessionEnrollment.updateMany({
      where: { sessionId: subscription.productId, userId: subscription.userId },
      data: { billingSubscriptionId: subscription.id, seatReleasedAt: null },
    });
  }
  return null;
}

async function processCapturedPayment(
  tx: TransactionClient,
  payload: RazorpayWebhookPayload,
  eventId: string,
) {
  const payment = getRazorpayEntity(payload, "payment");
  // Subscription charges also emit payment.captured. The corresponding
  // subscription.charged event is the sole recurring entitlement authority.
  if (getRazorpayString(payment, "subscription_id")) return null;
  const paymentId = getRazorpayString(payment, "id");
  const orderId = getRazorpayString(payment, "order_id");
  const amountPaise = getRazorpayAmount(payment);
  const currency = getRazorpayString(payment, "currency");
  if (!paymentId || !orderId || amountPaise === null || !currency) {
    return "Captured payment payload is missing a provider ID, order, amount, or currency";
  }
  const providerCapturedAt = getRazorpayWebhookCreatedAt(payload);
  if (!providerCapturedAt) return `Captured payment ${paymentId} is missing its signed event timestamp`;

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
        providerCapturedAt,
      },
    });
  } else if (!recordedPayment.providerCapturedAt) {
    recordedPayment = await tx.commercePayment.update({
      where: { id: recordedPayment.id },
      data: { providerCapturedAt },
    });
  }

  if (await markLateCheckoutPaymentForReview(tx, checkout.id, paymentId, eventId)) {
    return `Captured payment ${paymentId} belongs to a cancelled checkout`;
  }

  const snapshot = parseSnapshot(checkout.snapshot);
  const capturedAt = providerCapturedAt;
  let startsAt = capturedAt;
  let accessEndsAt: Date | null = null;

  if (checkout.productType === "COURSE") {
    const accessWindow = getCapturedCourseAccessWindow(snapshot, capturedAt);
    startsAt = accessWindow.startsAt;
    accessEndsAt = accessWindow.endsAt;
  } else if (checkout.productType === "GUIDANCE_SESSION") {
    accessEndsAt = getGuidanceAccessEnd(snapshot);
    if (accessEndsAt && accessEndsAt <= capturedAt) {
      await releaseSessionSeatHold(tx, checkout.id, capturedAt);
      await tx.commerceCheckout.update({
        where: { id: checkout.id },
        data: { status: "REQUIRES_REVIEW" },
      });
      await tx.billingOutbox.upsert({
        where: { dedupeKey: `expired-session-review:${paymentId}` },
        update: {},
        create: {
          dedupeKey: `expired-session-review:${paymentId}`,
          action: "SESSION_SEAT_REVIEW_REQUIRED",
          payload: { eventId, checkoutId: checkout.id, paymentId, reason: "SESSION_EXPIRED" },
        },
      });
      return `Captured payment ${paymentId} belongs to an expired guidance session`;
    }
  }

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

  if (checkout.productType === "COURSE") {
    const inclusionReviewSessionId = await projectCourseInclusions(tx, {
      userId: checkout.userId,
      checkoutId: checkout.id,
      snapshot,
      sourceType: "RAZORPAY_PAYMENT",
      sourceId: paymentId,
      startsAt,
      endsAt: accessEndsAt,
      recordedPaymentId: recordedPayment.id,
      providerPaymentId: paymentId,
    });
    if (inclusionReviewSessionId) {
      await tx.commerceCheckout.update({
        where: { id: checkout.id },
        data: { status: "REQUIRES_REVIEW" },
      });
      await tx.billingOutbox.upsert({
        where: { dedupeKey: `course-inclusion-review:${paymentId}` },
        update: {},
        create: {
          dedupeKey: `course-inclusion-review:${paymentId}`,
          action: "COURSE_INCLUSION_REVIEW_REQUIRED",
          payload: { eventId, checkoutId: checkout.id, paymentId, sessionId: inclusionReviewSessionId },
        },
      });
      return `Captured payment ${paymentId} requires course-inclusion review`;
    }
  }

  await tx.commerceCheckout.update({
    where: { id: checkout.id },
    data: { status: "PAID", paidAt: capturedAt },
  });

  if (checkout.productType === "COURSE") {
    await tx.commerceSubscriptionSlot.updateMany({
      where: { checkoutId: checkout.id },
      data: { releaseAfter: accessEndsAt },
    });
  }

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
    await projectCourseEnrollment(tx, checkout.userId, checkout.productId, accessEndsAt, startsAt);
  }
  if (checkout.productType === "GUIDANCE_SESSION") {
    await projectSessionEnrollment(
      tx,
      checkout,
      paymentId,
      amountPaise,
      snapshot,
      accessEndsAt ?? undefined,
      checkout.id,
      startsAt,
    );
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

async function markLateCheckoutPaymentForReview(
  tx: TransactionClient,
  checkoutId: string | null,
  paymentId: string,
  eventId: string,
) {
  if (!checkoutId) return false;
  const checkout = await tx.commerceCheckout.findUnique({
    where: { id: checkoutId },
    select: { status: true },
  });
  if (checkout?.status !== "FAILED" && checkout?.status !== "CANCELLED") return false;

  await tx.commerceCheckout.update({
    where: { id: checkoutId },
    data: { status: "REQUIRES_REVIEW" },
  });
  await tx.billingOutbox.upsert({
    where: { dedupeKey: `late-payment-review:${paymentId}` },
    update: {},
    create: {
      dedupeKey: `late-payment-review:${paymentId}`,
      action: "LATE_PAYMENT_REVIEW_REQUIRED",
      payload: { eventId, checkoutId, paymentId },
    },
  });
  return true;
}

async function processFailedPayment(
  tx: TransactionClient,
  payload: RazorpayWebhookPayload,
) {
  const payment = getRazorpayEntity(payload, "payment");
  const providerSubscriptionId = getRazorpayString(payment, "subscription_id");
  if (providerSubscriptionId) {
    const courseSubscription = await findCourseSubscriptionForEvent(tx, payment, providerSubscriptionId);
    const genericSubscription = courseSubscription
      ? null
      : await findCommerceSubscriptionForEvent(tx, payment, providerSubscriptionId);
    const originCheckoutId = courseSubscription?.originCheckoutId ?? genericSubscription?.originCheckoutId;
    if (!originCheckoutId) {
      return getRazorpayNote(payment, "checkout_id")
        ? `No V2 recurring subscription found for ${providerSubscriptionId}`
        : null;
    }

    // A recurring payment can be retried by Razorpay. Subscription lifecycle
    // events decide terminal state; a single failed charge must not tear down it.
    return null;
  }

  const orderId = getRazorpayString(payment, "order_id");
  if (!orderId) return "Failed payment payload is missing its provider order or subscription";

  const checkout = await findCheckoutForCapturedPayment(tx, payment, orderId);
  if (!checkout) return `No V2 checkout found for failed Razorpay order ${orderId}`;

  // A Razorpay Order can receive another payment attempt after one attempt
  // fails. Keep the checkout and its reservations intact until provider
  // reconciliation proves that the order was abandoned or completed.
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

  if (
    isNewer
    && (eventType === "subscription.cancelled" || eventType === "subscription.completed")
    && !currentPeriodEnd
    && subscription.originCheckoutId
  ) {
    await releaseSessionSeatHold(tx, subscription.originCheckoutId, eventAt);
    await tx.commerceSubscriptionSlot.deleteMany({ where: { checkoutId: subscription.originCheckoutId } });
    await tx.commerceCheckout.updateMany({
      where: { id: subscription.originCheckoutId, status: { not: "PAID" } },
      data: { status: "CANCELLED" },
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
  const providerCapturedAt = getRazorpayWebhookCreatedAt(payload);
  if (!providerCapturedAt) return `Charged subscription ${providerSubscriptionId} is missing its signed event timestamp`;

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
        providerCapturedAt,
      },
    });
  } else if (!recordedPayment.providerCapturedAt) {
    recordedPayment = await tx.commercePayment.update({
      where: { id: recordedPayment.id },
      data: { providerCapturedAt },
    });
  }

  if (await markLateCheckoutPaymentForReview(tx, subscription.originCheckoutId, paymentId, eventId)) {
    return `Charged subscription ${providerSubscriptionId} belongs to a cancelled checkout`;
  }

  const subscriptionStartsAt = getRecurringAccessStart(
    providerCapturedAt,
    currentPeriodStart,
    new Date(),
  );

  const inclusionReviewSessionId = await projectCourseInclusions(tx, {
    userId: subscription.userId,
    checkoutId: subscription.originCheckoutId,
    snapshot: parseSnapshot(subscription.entitlementSnapshot),
    sourceType: "RAZORPAY_SUBSCRIPTION",
    sourceId: subscription.id,
    startsAt: subscriptionStartsAt,
    endsAt: currentPeriodEnd,
    recordedPaymentId: recordedPayment.id,
    providerPaymentId: paymentId,
  });
  if (inclusionReviewSessionId) {
    if (subscription.originCheckoutId) {
      await tx.commerceCheckout.update({
        where: { id: subscription.originCheckoutId },
        data: { status: "REQUIRES_REVIEW" },
      });
    }
    await tx.billingOutbox.upsert({
      where: { dedupeKey: `course-inclusion-review:${paymentId}` },
      update: {},
      create: {
        dedupeKey: `course-inclusion-review:${paymentId}`,
        action: "COURSE_INCLUSION_REVIEW_REQUIRED",
        payload: {
          eventId,
          subscriptionId: subscription.id,
          paymentId,
          sessionId: inclusionReviewSessionId,
        },
      },
    });
    return `Charged subscription ${providerSubscriptionId} requires course-inclusion review`;
  }

  await upsertEntitlement(tx, {
    userId: subscription.userId,
    resourceType: "COURSE",
    resourceId: subscription.courseId,
    sourceType: "RAZORPAY_SUBSCRIPTION",
    sourceId: subscription.id,
    startsAt: subscriptionStartsAt,
    endsAt: currentPeriodEnd,
    lastPaymentId: recordedPayment.id,
  });
  await projectCourseEnrollment(
    tx,
    subscription.userId,
    subscription.courseId,
    currentPeriodEnd,
    subscriptionStartsAt,
  );
  if (subscription.originCheckoutId) {
    await tx.commerceCheckout.update({
      where: { id: subscription.originCheckoutId },
      data: {
        status: "PAID",
        paidAt: providerCapturedAt,
      },
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
  if (
    isNewer
    && (eventType === "subscription.cancelled" || eventType === "subscription.completed")
    && !currentPeriodEnd
    && subscription.originCheckoutId
  ) {
    await releaseSessionSeatHold(tx, subscription.originCheckoutId, eventAt);
    await tx.commerceSubscriptionSlot.deleteMany({ where: { checkoutId: subscription.originCheckoutId } });
    await tx.commerceCheckout.updateMany({
      where: { id: subscription.originCheckoutId, status: { not: "PAID" } },
      data: { status: "CANCELLED" },
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
  const providerCapturedAt = getRazorpayWebhookCreatedAt(payload);
  if (!providerCapturedAt) return `Charged subscription ${providerSubscriptionId} is missing its signed event timestamp`;
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
        providerCapturedAt,
      },
    });
  } else if (!recordedPayment.providerCapturedAt) {
    recordedPayment = await tx.commercePayment.update({
      where: { id: recordedPayment.id },
      data: { providerCapturedAt },
    });
  }

  if (await markLateCheckoutPaymentForReview(tx, subscription.originCheckoutId, paymentId, eventId)) {
    return `Charged subscription ${providerSubscriptionId} belongs to a cancelled checkout`;
  }

  const subscriptionStartsAt = getRecurringAccessStart(
    providerCapturedAt,
    currentPeriodStart,
    new Date(),
  );

  const reviewCheckoutId = await projectGenericRecurringEntitlements(
    tx,
    subscription,
    recordedPayment.id,
    subscriptionStartsAt,
    currentPeriodEnd,
    paymentId,
    amountPaise,
  );
  if (reviewCheckoutId) {
    await tx.commerceCheckout.update({ where: { id: reviewCheckoutId }, data: { status: "REQUIRES_REVIEW" } });
    await tx.billingOutbox.upsert({
      where: { dedupeKey: `session-seat-review:${paymentId}` },
      update: {},
      create: {
        dedupeKey: `session-seat-review:${paymentId}`,
        action: "SESSION_SEAT_REVIEW_REQUIRED",
        payload: { eventId, subscriptionId: subscription.id, paymentId },
      },
    });
    return `Recurring guidance subscription ${providerSubscriptionId} requires session-seat review`;
  }
  if (subscription.originCheckoutId) {
    await tx.commerceCheckout.update({
      where: { id: subscription.originCheckoutId },
      data: {
        status: "PAID",
        paidAt: providerCapturedAt,
      },
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

      const decision = classifyWebhookProcessingError(processingError);
      if (decision === "RETRY") {
        throw new Error(processingError ?? "Webhook processing must be retried");
      }

      await tx.razorpayWebhookEvent.update({
        where: { providerEventId: input.eventId },
        data: {
          status: decision === "ACKNOWLEDGE_REVIEW" ? "FAILED" : "PROCESSED",
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
