import { NextResponse } from "next/server";
import {
  CommerceCheckoutStatus,
  CommerceCheckoutType,
  CommerceProductType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDbUserFromClerk } from "@/lib/roleAuth";
import { getCourseExpiryDate } from "@/lib/course-expiry";
import { assertRazorpayServerConfiguration, razorpay } from "@/lib/razorpay";
import {
  CommerceCheckoutInputError,
  parseCheckoutIntentInput,
  parseRupeesToPaise,
  type CheckoutIntentInput,
} from "@/lib/commerce-checkout";
import {
  evaluateGeneralCouponForCheckout,
  GeneralCouponCheckoutError,
  type GeneralCouponProductType,
} from "@/lib/general-coupon-checkout";
import {
  acquireSessionSeatHold,
  releaseSessionSeatHold,
  SessionSeatUnavailableError,
} from "@/lib/session-seat-inventory";

export const runtime = "nodejs";

const V2_CHECKOUT_ENABLED = process.env.V2_CHECKOUT_ENABLED === "true";

type PreparedCheckout = {
  productType: CommerceProductType;
  checkoutType: CommerceCheckoutType;
  productId: string;
  amountPaise: number;
  originalAmountPaise: number;
  discountPaise: number;
  couponCode: string | null;
  snapshot: Record<string, unknown>;
  razorpayPlanId?: string;
  billingPlanId?: string;
  totalCount?: number;
  generalCouponProductType?: GeneralCouponProductType;
};

function isRecurringCheckout(checkoutType: CommerceCheckoutType) {
  return checkoutType === "RECURRING" || checkoutType === "COURSE_RECURRING";
}

function errorResponse(error: unknown) {
  if (error instanceof CommerceCheckoutInputError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof GeneralCouponCheckoutError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof SessionSeatUnavailableError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  console.error("V2 checkout intent error:", error);
  return NextResponse.json({ error: "Unable to create checkout" }, { status: 500 });
}

const GENERAL_COUPON_PRODUCT_TYPE: Partial<Record<CommerceProductType, GeneralCouponProductType>> = {
  MOCK_TEST: "INDIVIDUAL_MOCK",
  MOCK_BUNDLE: "MOCK_BUNDLE",
  GUIDANCE_SESSION: "GUIDANCE_SESSION",
};

const GENERAL_COUPON_RESERVATION_MS = 30 * 60 * 1000;

async function applyGeneralCoupon(
  tx: Prisma.TransactionClient,
  input: {
    checkoutId: string;
    userId: string;
    couponCode: string;
    productType: GeneralCouponProductType;
    productId: string;
    originalAmountPaise: number;
    snapshot: Record<string, unknown>;
    now: Date;
  },
) {
  let coupon = await tx.generalCoupon.findUnique({ where: { code: input.couponCode } });
  if (!coupon) throw new GeneralCouponCheckoutError("Invalid coupon code");

  const expiredReservations = await tx.generalCouponReservation.updateMany({
    where: { couponId: coupon.id, status: "RESERVED", expiresAt: { lte: input.now } },
    data: { status: "EXPIRED", releasedAt: input.now },
  });
  if (expiredReservations.count > 0) {
    await tx.generalCoupon.update({
      where: { id: coupon.id },
      data: { reservedCount: { decrement: expiredReservations.count } },
    });
    coupon = await tx.generalCoupon.findUniqueOrThrow({ where: { id: coupon.id } });
  }

  const [userUsageCount, userReservationCount] = await Promise.all([
    tx.generalCouponUsage.count({ where: { couponId: coupon.id, userId: input.userId } }),
    tx.generalCouponReservation.count({
      where: { couponId: coupon.id, userId: input.userId, status: "RESERVED", expiresAt: { gt: input.now } },
    }),
  ]);
  if (coupon.usageLimit !== null) {
    const claim = await tx.generalCoupon.updateMany({
      where: { id: coupon.id, usageCount: coupon.usageCount, reservedCount: coupon.reservedCount },
      data: { reservedCount: { increment: 1 } },
    });
    if (claim.count !== 1) {
      throw new GeneralCouponCheckoutError("Coupon availability changed. Please try again");
    }
  }

  const result = evaluateGeneralCouponForCheckout({
    coupon,
    productType: input.productType,
    productId: input.productId,
    originalAmountPaise: input.originalAmountPaise,
    userUsageCount,
    userReservationCount,
    now: input.now,
  });

  await tx.generalCouponReservation.create({
    data: {
      couponId: coupon.id,
      userId: input.userId,
      checkoutId: input.checkoutId,
      expiresAt: new Date(input.now.getTime() + GENERAL_COUPON_RESERVATION_MS),
    },
  });

  return {
    ...result,
    snapshot: {
      ...input.snapshot,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        productType: input.productType,
        originalAmountPaise: result.originalAmountPaise,
        discountPaise: result.discountPaise,
        amountPaise: result.amountPaise,
      },
    },
  };
}

async function releaseGeneralCouponReservation(checkoutId: string) {
  await prisma.$transaction(async (tx) => {
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
  });
}

function activeDateFilter(now: Date) {
  return {
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gt: now } }],
  };
}

async function hasActiveV2Entitlement(
  userId: string,
  resourceType: "COURSE" | "MOCK_TEST" | "MOCK_BUNDLE" | "GUIDANCE_SESSION",
  resourceId: string,
  now: Date,
) {
  return Boolean(await prisma.entitlement.findFirst({
    where: {
      userId,
      resourceType,
      resourceId,
      status: "ACTIVE",
      ...activeDateFilter(now),
    },
    select: { id: true },
  }));
}

async function prepareCourseCheckout(input: CheckoutIntentInput, userId: string, now: Date): Promise<PreparedCheckout> {
  const course = await prisma.course.findUnique({ where: { id: input.productId } });
  if (!course || course.status !== "PUBLISHED") {
    throw new CommerceCheckoutInputError("Course is not available for purchase");
  }

  if (isRecurringCheckout(input.checkoutType)) {
    if (input.couponCode) {
      throw new CommerceCheckoutInputError("Coupons are not available for recurring courses");
    }
    if (course.billingMode !== "RECURRING" || !course.subscriptionEnabled) {
      throw new CommerceCheckoutInputError("Recurring subscriptions are not enabled for this course");
    }

    const plan = await prisma.courseBillingPlan.findFirst({
      where: { courseId: course.id, status: "ACTIVE" },
      orderBy: { version: "desc" },
    });
    if (!plan?.razorpayPlanId || plan.providerSyncState !== "ACTIVE") {
      throw new CommerceCheckoutInputError("This course subscription is not ready for checkout");
    }

    const existingSubscription = await prisma.courseBillingSubscription.findFirst({
      where: {
        userId,
        courseId: course.id,
        providerStatus: { in: ["CREATED", "AUTHENTICATED", "ACTIVE", "PENDING", "HALTED", "PAUSED"] },
      },
      select: { id: true },
    });
    if (existingSubscription) {
      throw new CommerceCheckoutInputError("You already have a recurring subscription for this course");
    }

    return {
      productType: "COURSE",
      // Course subscriptions continue through the established course-specific
      // records until their data migration is explicitly completed.
      checkoutType: "COURSE_RECURRING",
      productId: course.id,
      amountPaise: plan.amountPaise,
      originalAmountPaise: plan.amountPaise,
      discountPaise: 0,
      couponCode: null,
      razorpayPlanId: plan.razorpayPlanId,
      billingPlanId: plan.id,
      totalCount: plan.totalCount,
      snapshot: {
        courseId: course.id,
        title: course.title,
        billingPlanId: plan.id,
        billingPlanVersion: plan.version,
        amountPaise: plan.amountPaise,
        currency: plan.currency,
        interval: plan.interval,
        totalCount: plan.totalCount,
      },
    };
  }

  if (course.billingMode === "RECURRING" && course.subscriptionEnabled) {
    throw new CommerceCheckoutInputError("This course requires recurring checkout");
  }

  const [legacyEnrollment, activeEntitlement] = await Promise.all([
    prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: course.id,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true },
    }),
    hasActiveV2Entitlement(userId, "COURSE", course.id, now),
  ]);
  if (legacyEnrollment || activeEntitlement) {
    throw new CommerceCheckoutInputError("You already have access to this course");
  }

  const originalAmountPaise = parseRupeesToPaise(course.actualPrice ?? course.price);
  let amountPaise = originalAmountPaise;
  let couponCode: string | null = null;
  let discountPaise = 0;
  let couponSnapshot: Record<string, unknown> | null = null;

  if (input.couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: input.couponCode } });
    if (!coupon || coupon.courseId !== course.id || coupon.validTill <= now) {
      throw new CommerceCheckoutInputError("Invalid or expired course coupon");
    }
    if (coupon.discountPct < 0 || coupon.discountPct > 100) {
      throw new CommerceCheckoutInputError("Course coupon has an invalid discount");
    }
    discountPaise = Math.floor((originalAmountPaise * coupon.discountPct) / 100);
    amountPaise = originalAmountPaise - discountPaise;
    couponCode = coupon.code;
    couponSnapshot = {
      id: coupon.id,
      code: coupon.code,
      discountPct: coupon.discountPct,
    };
  }

  if (amountPaise < 100) {
    throw new CommerceCheckoutInputError("Free checkout is not yet available for this course");
  }

  return {
    productType: "COURSE",
    checkoutType: "ONE_TIME",
    productId: course.id,
    amountPaise,
    originalAmountPaise,
    discountPaise,
    couponCode,
    snapshot: {
      courseId: course.id,
      title: course.title,
      durationMonths: course.durationMonths,
      accessEndsAt: getCourseExpiryDate(now, course.durationMonths).toISOString(),
      ...(couponSnapshot ? { coupon: couponSnapshot } : {}),
    },
  };
}

async function prepareGenericRecurringCheckout(
  input: CheckoutIntentInput,
  userId: string,
  now: Date,
): Promise<PreparedCheckout> {
  if (input.productType === "COURSE") return prepareCourseCheckout(input, userId, now);
  if (input.couponCode) {
    throw new CommerceCheckoutInputError("Coupons are not available for recurring subscriptions");
  }

  let title: string;
  let snapshot: Record<string, unknown>;
  if (input.productType === "MOCK_TEST") {
    const mock = await prisma.mockTest.findUnique({ where: { id: input.productId } });
    if (!mock || mock.status !== "PUBLISHED" || mock.billingMode !== "RECURRING" || !mock.subscriptionEnabled) {
      throw new CommerceCheckoutInputError("Recurring subscriptions are not enabled for this mock test");
    }
    title = mock.title;
    snapshot = { title, mockIds: [mock.id] };
  } else if (input.productType === "MOCK_BUNDLE") {
    const bundle = await prisma.mockBundle.findUnique({ where: { id: input.productId } });
    if (!bundle || bundle.status !== "PUBLISHED" || bundle.billingMode !== "RECURRING" || !bundle.subscriptionEnabled) {
      throw new CommerceCheckoutInputError("Recurring subscriptions are not enabled for this mock bundle");
    }
    const mockIds = [...new Set(bundle.mockIds)];
    const publishedMocks = await prisma.mockTest.count({ where: { id: { in: mockIds }, status: "PUBLISHED" } });
    if (mockIds.length === 0 || publishedMocks !== mockIds.length) {
      throw new CommerceCheckoutInputError("Mock bundle contains unavailable mock tests");
    }
    title = bundle.title;
    snapshot = { title, mockIds };
  } else {
    const session = await prisma.session.findUnique({ where: { id: input.productId } });
    if (!session || session.status !== "PUBLISHED" || session.billingMode !== "RECURRING" || !session.subscriptionEnabled) {
      throw new CommerceCheckoutInputError("Recurring subscriptions are not enabled for this guidance program");
    }
    if (session.expiryDate) {
      throw new CommerceCheckoutInputError("A recurring guidance program cannot have a fixed expiry date");
    }
    if (!input.studentPhone) throw new CommerceCheckoutInputError("Student phone number is required");
    title = session.title;
    snapshot = { title, mockIds: [], studentPhone: input.studentPhone, sessionCapacity: session.maxEnrollment };
  }

  const plan = await prisma.commerceBillingPlan.findFirst({
    where: { productType: input.productType, productId: input.productId, status: "ACTIVE" },
    orderBy: { version: "desc" },
  });
  if (!plan?.razorpayPlanId || plan.providerSyncState !== "ACTIVE") {
    throw new CommerceCheckoutInputError("This subscription is not ready for checkout");
  }
  const existing = await prisma.commerceBillingSubscription.findFirst({
    where: {
      userId,
      productType: input.productType,
      productId: input.productId,
      providerStatus: { in: ["CREATED", "AUTHENTICATED", "ACTIVE", "PENDING", "HALTED", "PAUSED"] },
    },
    select: { id: true },
  });
  if (existing) throw new CommerceCheckoutInputError("You already have a recurring subscription for this product");

  return {
    productType: input.productType as CommerceProductType,
    checkoutType: "RECURRING",
    productId: input.productId,
    amountPaise: plan.amountPaise,
    originalAmountPaise: plan.amountPaise,
    discountPaise: 0,
    couponCode: null,
    razorpayPlanId: plan.razorpayPlanId,
    billingPlanId: plan.id,
    totalCount: plan.totalCount,
    snapshot: {
      ...snapshot,
      billingPlanId: plan.id,
      billingPlanVersion: plan.version,
      amountPaise: plan.amountPaise,
      currency: plan.currency,
      interval: plan.interval,
      totalCount: plan.totalCount,
    },
  };
}

async function prepareOneTimeCheckout(input: CheckoutIntentInput, userId: string, now: Date): Promise<PreparedCheckout> {
  if (input.checkoutType !== "ONE_TIME") {
    return input.checkoutType === "RECURRING"
      ? prepareGenericRecurringCheckout(input, userId, now)
      : prepareCourseCheckout(input, userId, now);
  }

  if (input.productType === "COURSE") {
    return prepareCourseCheckout(input, userId, now);
  }

  if (input.productType === "MOCK_TEST") {
    const mock = await prisma.mockTest.findUnique({ where: { id: input.productId } });
    if (!mock || mock.status !== "PUBLISHED") {
      throw new CommerceCheckoutInputError("Mock test is not available for purchase");
    }
    const amountPaise = parseRupeesToPaise(mock.actualPrice ?? mock.price);
    if (await hasActiveV2Entitlement(userId, "MOCK_TEST", mock.id, now)) {
      throw new CommerceCheckoutInputError("You already have access to this mock test");
    }
    return {
      productType: "MOCK_TEST",
      checkoutType: "ONE_TIME",
      productId: mock.id,
      amountPaise,
      originalAmountPaise: amountPaise,
      discountPaise: 0,
      couponCode: input.couponCode,
      generalCouponProductType: GENERAL_COUPON_PRODUCT_TYPE.MOCK_TEST,
      snapshot: { title: mock.title, mockIds: [mock.id] },
    };
  }

  if (input.productType === "MOCK_BUNDLE") {
    const bundle = await prisma.mockBundle.findUnique({ where: { id: input.productId } });
    if (!bundle || bundle.status !== "PUBLISHED" || bundle.mockIds.length === 0) {
      throw new CommerceCheckoutInputError("Mock bundle is not available for purchase");
    }

    const mockIds = [...new Set(bundle.mockIds)];
    const mocks = await prisma.mockTest.findMany({
      where: { id: { in: mockIds }, status: "PUBLISHED" },
      select: { id: true },
    });
    if (mocks.length !== mockIds.length) {
      throw new CommerceCheckoutInputError("Mock bundle contains unavailable mock tests");
    }

    const amountPaise = parseRupeesToPaise(bundle.discountedPrice ?? bundle.basePrice);
    const originalAmountPaise = parseRupeesToPaise(bundle.basePrice);
    if (await hasActiveV2Entitlement(userId, "MOCK_BUNDLE", bundle.id, now)) {
      throw new CommerceCheckoutInputError("You already have access to this mock bundle");
    }
    return {
      productType: "MOCK_BUNDLE",
      checkoutType: "ONE_TIME",
      productId: bundle.id,
      amountPaise,
      originalAmountPaise,
      discountPaise: Math.max(0, originalAmountPaise - amountPaise),
      couponCode: input.couponCode,
      generalCouponProductType: GENERAL_COUPON_PRODUCT_TYPE.MOCK_BUNDLE,
      snapshot: { title: bundle.title, mockIds },
    };
  }

  const session = await prisma.session.findUnique({ where: { id: input.productId } });
  if (!session || session.status !== "PUBLISHED") {
    throw new CommerceCheckoutInputError("Guidance session is not available for purchase");
  }
  if (session.expiryDate && session.expiryDate <= now) {
    throw new CommerceCheckoutInputError("Guidance session has expired");
  }
  if (!input.studentPhone) {
    throw new CommerceCheckoutInputError("Student phone number is required");
  }

  const existingSessionEnrollment = await prisma.sessionEnrollment.findUnique({
    where: { sessionId_userId: { sessionId: session.id, userId } },
    select: { paymentStatus: true },
  });
  if (existingSessionEnrollment?.paymentStatus === "SUCCESS") {
    throw new CommerceCheckoutInputError("You already have access to this guidance session");
  }
  if (existingSessionEnrollment?.paymentStatus === "PENDING") {
    throw new CommerceCheckoutInputError("A guidance-session checkout is already in progress");
  }

  const amountPaise = parseRupeesToPaise(session.discountedPrice ?? session.price);
  if (await hasActiveV2Entitlement(userId, "GUIDANCE_SESSION", session.id, now)) {
    throw new CommerceCheckoutInputError("You already have access to this guidance session");
  }
  return {
    productType: "GUIDANCE_SESSION",
    checkoutType: "ONE_TIME",
    productId: session.id,
    amountPaise,
    originalAmountPaise: amountPaise,
    discountPaise: 0,
    couponCode: input.couponCode,
    generalCouponProductType: GENERAL_COUPON_PRODUCT_TYPE.GUIDANCE_SESSION,
    snapshot: {
      title: session.title,
      studentPhone: input.studentPhone,
      sessionExpiryDate: session.expiryDate?.toISOString() ?? null,
      sessionCapacity: session.maxEnrollment,
    },
  };
}

function checkoutResponse(checkout: {
  id: string;
  status: CommerceCheckoutStatus;
  checkoutType: CommerceCheckoutType;
  productType: CommerceProductType;
  productId: string;
  amountPaise: number;
  currency: string;
  razorpayOrderId: string | null;
  razorpaySubscriptionId: string | null;
  paidAt: Date | null;
}) {
  return {
    id: checkout.id,
    status: checkout.status,
    checkoutType: checkout.checkoutType,
    productType: checkout.productType,
    productId: checkout.productId,
    amountPaise: checkout.amountPaise,
    currency: checkout.currency,
    razorpayOrderId: checkout.razorpayOrderId,
    razorpaySubscriptionId: checkout.razorpaySubscriptionId,
    paidAt: checkout.paidAt,
  };
}

export async function POST(req: Request) {
  if (!V2_CHECKOUT_ENABLED) {
    return NextResponse.json(
      { error: "V2 checkout is not enabled", code: "V2_CHECKOUT_DISABLED" },
      { status: 503 },
    );
  }

  try {
    const user = await getDbUserFromClerk();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const input = parseCheckoutIntentInput(await req.json());
    const now = new Date();

    if (input.idempotencyKey) {
      const existing = await prisma.commerceCheckout.findFirst({
        where: {
          userId: user.id,
          productType: input.productType as CommerceProductType,
          productId: input.productId,
          checkoutType: input.checkoutType as CommerceCheckoutType,
          idempotencyKey: input.idempotencyKey,
          status: { in: ["CREATED", "PROVIDER_CREATED", "PENDING", "PAID", "REQUIRES_REVIEW"] },
        },
        orderBy: { createdAt: "desc" },
      });
      if (existing?.status === "REQUIRES_REVIEW") {
        return NextResponse.json(
          { error: "This checkout requires payment review", code: "CHECKOUT_REQUIRES_REVIEW" },
          { status: 409 },
        );
      }
      if (existing?.status === "PAID") {
        return NextResponse.json({ checkout: checkoutResponse(existing) }, { status: 200 });
      }
      if (existing?.razorpayOrderId) {
        return NextResponse.json({
          checkout: checkoutResponse(existing),
          order: {
            id: existing.razorpayOrderId,
            amount: existing.amountPaise,
            currency: existing.currency,
          },
        }, { status: 200 });
      }
      if (existing?.razorpaySubscriptionId) {
        return NextResponse.json({
          checkout: checkoutResponse(existing),
          subscription: { id: existing.razorpaySubscriptionId },
        }, { status: 200 });
      }
      if (existing) {
        return NextResponse.json({ error: "Checkout is already being created", code: "CHECKOUT_IN_PROGRESS" }, { status: 409 });
      }
    }

    const prepared = await prepareOneTimeCheckout(input, user.id, now);
    const pendingCheckout = await prisma.$transaction(async (tx) => {
      const checkout = await tx.commerceCheckout.create({
        data: {
          userId: user.id,
          productType: prepared.productType,
          checkoutType: prepared.checkoutType,
          productId: prepared.productId,
          status: "CREATED",
          currency: "INR",
          amountPaise: prepared.amountPaise,
          originalAmountPaise: prepared.originalAmountPaise,
          discountPaise: prepared.discountPaise,
          couponCode: prepared.couponCode,
          snapshot: prepared.snapshot as Prisma.InputJsonValue,
          idempotencyKey: input.idempotencyKey,
        },
      });

      if (prepared.productType === "GUIDANCE_SESSION") {
        const sessionCapacity = typeof prepared.snapshot.sessionCapacity === "number"
          ? prepared.snapshot.sessionCapacity
          : null;
        await acquireSessionSeatHold(tx, {
          checkoutId: checkout.id,
          userId: user.id,
          session: { id: prepared.productId, maxEnrollment: sessionCapacity },
          now,
        });
      }

      if (prepared.couponCode && prepared.generalCouponProductType) {
        const coupon = await applyGeneralCoupon(tx, {
          checkoutId: checkout.id,
          userId: user.id,
          couponCode: prepared.couponCode,
          productType: prepared.generalCouponProductType,
          productId: prepared.productId,
          originalAmountPaise: prepared.originalAmountPaise,
          snapshot: prepared.snapshot,
          now,
        });
      await tx.commerceCheckout.update({
        where: { id: checkout.id },
        data: {
          originalAmountPaise: coupon.originalAmountPaise,
          amountPaise: coupon.amountPaise,
            discountPaise: coupon.discountPaise,
            couponCode: coupon.couponCode,
            snapshot: coupon.snapshot as Prisma.InputJsonValue,
          },
        });
      }

       if (isRecurringCheckout(prepared.checkoutType) && prepared.billingPlanId) {
         if (prepared.checkoutType === "COURSE_RECURRING") {
           await tx.courseBillingSubscription.create({
             data: {
               userId: user.id,
               courseId: prepared.productId,
               billingPlanId: prepared.billingPlanId,
               razorpaySubscriptionId: `pending:${checkout.id}`,
               providerStatus: "CREATED",
             },
           });
         } else {
           await tx.commerceBillingSubscription.create({
             data: {
               userId: user.id,
               productType: prepared.productType,
               productId: prepared.productId,
               billingPlanId: prepared.billingPlanId,
               originCheckoutId: checkout.id,
               razorpaySubscriptionId: `pending:${checkout.id}`,
               providerStatus: "CREATED",
               entitlementSnapshot: prepared.snapshot as Prisma.InputJsonValue,
             },
           });
         }
      }
      return tx.commerceCheckout.findUniqueOrThrow({ where: { id: checkout.id } });
    });

    assertRazorpayServerConfiguration();

    let providerCheckoutCreated = false;
    try {
       if (isRecurringCheckout(prepared.checkoutType)) {
        const providerSubscription = await razorpay.subscriptions.create({
          plan_id: prepared.razorpayPlanId!,
          total_count: prepared.totalCount!,
          customer_notify: 1,
           notes: {
             checkout_id: pendingCheckout.id,
             product_type: prepared.productType,
             product_id: prepared.productId,
           },
        });
        providerCheckoutCreated = true;
        const providerSubscriptionId = providerSubscription.id;
        const checkout = await prisma.$transaction(async (tx) => {
          await tx.commerceCheckout.update({
            where: { id: pendingCheckout.id },
            data: { status: "PROVIDER_CREATED", razorpaySubscriptionId: providerSubscriptionId },
          });
           if (prepared.checkoutType === "COURSE_RECURRING") {
             await tx.courseBillingSubscription.update({
               where: { razorpaySubscriptionId: `pending:${pendingCheckout.id}` },
               data: { razorpaySubscriptionId: providerSubscriptionId },
             });
           } else {
             await tx.commerceBillingSubscription.update({
               where: { razorpaySubscriptionId: `pending:${pendingCheckout.id}` },
               data: { razorpaySubscriptionId: providerSubscriptionId },
             });
           }
          return tx.commerceCheckout.findUniqueOrThrow({ where: { id: pendingCheckout.id } });
        });
        return NextResponse.json({
          checkout: checkoutResponse(checkout),
          subscription: { id: providerSubscription.id, status: providerSubscription.status },
        }, { status: 201 });
      }

      const order = await razorpay.orders.create({
        amount: prepared.amountPaise,
        currency: "INR",
        receipt: `co_${pendingCheckout.id}`,
        notes: { checkout_id: pendingCheckout.id, product_id: prepared.productId },
      });
      providerCheckoutCreated = true;
      const checkout = await prisma.commerceCheckout.update({
        where: { id: pendingCheckout.id },
        data: { status: "PROVIDER_CREATED", razorpayOrderId: order.id },
      });
      return NextResponse.json({
        checkout: checkoutResponse(checkout),
        order: { id: order.id, amount: order.amount, currency: order.currency },
      }, { status: 201 });
    } catch (providerError) {
      await prisma.$transaction(async (tx) => {
        await tx.commerceCheckout.update({
          where: { id: pendingCheckout.id },
          data: { status: providerCheckoutCreated ? "REQUIRES_REVIEW" : "FAILED" },
        });
         if (isRecurringCheckout(prepared.checkoutType) && !providerCheckoutCreated) {
           if (prepared.checkoutType === "COURSE_RECURRING") {
             await tx.courseBillingSubscription.update({
               where: { razorpaySubscriptionId: `pending:${pendingCheckout.id}` },
               data: { providerStatus: "CANCELLED", cancelledAt: new Date() },
             });
           } else {
             await tx.commerceBillingSubscription.update({
               where: { razorpaySubscriptionId: `pending:${pendingCheckout.id}` },
               data: { providerStatus: "CANCELLED", cancelledAt: new Date() },
             });
           }
        }
        if (prepared.productType === "GUIDANCE_SESSION" && !providerCheckoutCreated) {
          await releaseSessionSeatHold(tx, pendingCheckout.id, new Date());
        }
      }).catch((cleanupError) => console.error("Failed to mark V2 checkout provider failure:", cleanupError));
      if (!providerCheckoutCreated) {
        await releaseGeneralCouponReservation(pendingCheckout.id).catch((cleanupError) =>
          console.error("Failed to release V2 coupon reservation:", cleanupError),
        );
      }
      throw providerError;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Razorpay server configuration is missing") {
      return NextResponse.json({ error: "Payment provider is not configured" }, { status: 503 });
    }
    return errorResponse(error);
  }
}
