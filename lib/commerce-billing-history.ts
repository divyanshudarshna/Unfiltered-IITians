import { prisma } from "./prisma";

/** Resolve ownership through checkouts/subscriptions, including older payments without checkoutId. */
export async function getCommerceBillingHistory(userId: string, paymentId?: string) {
  const [checkouts, courses, products] = await Promise.all([
    prisma.commerceCheckout.findMany({ where: { userId } }),
    prisma.courseBillingSubscription.findMany({ where: { userId }, include: { course: { select: { title: true } } } }),
    prisma.commerceBillingSubscription.findMany({ where: { userId } }),
  ]);
  const subscriptionIds = [...courses, ...products].map((subscription) => subscription.razorpaySubscriptionId);
  if (!checkouts.length && !subscriptionIds.length) return [];
  const payments = await prisma.commercePayment.findMany({
    where: {
      ...(paymentId ? { id: paymentId } : {}),
      status: { in: ["CAPTURED", "REFUNDED"] },
      OR: [{ checkoutId: { in: checkouts.map((checkout) => checkout.id) } }, { providerSubscriptionId: { in: subscriptionIds } }],
    },
    orderBy: { providerCapturedAt: "desc" },
  });
  const entitlements = await prisma.entitlement.findMany({
    where: { userId, sourceId: { in: [
      ...payments.flatMap((payment) => payment.providerPaymentId ? [payment.providerPaymentId] : []),
      ...courses.map((subscription) => subscription.id), ...products.map((subscription) => subscription.id),
    ] } },
  });
  const checkoutById = new Map(checkouts.map((checkout) => [checkout.id, checkout]));
  const subscriptionById = new Map([...courses, ...products].map((subscription) => [subscription.razorpaySubscriptionId, subscription]));
  const titles = new Map(courses.map((subscription) => [subscription.razorpaySubscriptionId, subscription.course.title]));
  const itemTypes: Record<string, string> = { COURSE: "Course", MOCK_TEST: "Mock Test", MOCK_BUNDLE: "Mock Bundle", GUIDANCE_SESSION: "Guidance Session" };

  return payments.flatMap((payment) => {
    const subscription = payment.providerSubscriptionId ? subscriptionById.get(payment.providerSubscriptionId) : undefined;
    const checkout = checkoutById.get(payment.checkoutId ?? subscription?.originCheckoutId ?? "");
    // Never disclose a payment whose checkout/subscription ownership cannot be resolved.
    if (!checkout) return [];
    const snapshot = checkout.snapshot && typeof checkout.snapshot === "object" && !Array.isArray(checkout.snapshot)
      ? checkout.snapshot as Record<string, unknown> : {};
    const recurring = checkout.checkoutType !== "ONE_TIME";
    const entitlement = entitlements.find((row) => row.resourceType === checkout.productType && row.resourceId === checkout.productId
      && row.sourceType === (recurring ? "RAZORPAY_SUBSCRIPTION" : "RAZORPAY_PAYMENT")
      && row.sourceId === (recurring ? subscription?.id : payment.providerPaymentId));
    const expiresAt = entitlement ? entitlement.endsAt : subscription?.currentPeriodEnd ?? null;
    const now = new Date();
    const accessActive = Boolean(entitlement?.status === "ACTIVE" && entitlement.startsAt <= now && (!expiresAt || expiresAt > now));
    return [{
      id: payment.id,
      type: "subscription" as const,
      checkoutId: checkout.id,
      subscriptionId: subscription?.id ?? null,
      itemType: `${itemTypes[checkout.productType] ?? "Purchase"}${recurring ? " · Monthly" : ""}`,
      itemTitle: typeof snapshot.title === "string" ? snapshot.title : titles.get(payment.providerSubscriptionId ?? "") ?? "Purchase",
      itemDescription: "",
      orderId: payment.providerOrderId ?? checkout.razorpayOrderId ?? payment.providerSubscriptionId ?? "N/A",
      paymentId: payment.providerPaymentId ?? "N/A",
      originalPrice: (recurring ? payment.amountPaise : checkout.originalAmountPaise ?? payment.amountPaise) / 100,
      actualAmountPaid: payment.amountPaise / 100,
      discountApplied: recurring ? 0 : checkout.discountPaise / 100,
      couponCode: recurring ? null : checkout.couponCode,
      currency: payment.currency,
      paymentStatus: payment.status,
      paidAt: payment.providerCapturedAt ?? checkout.paidAt ?? payment.createdAt,
      expiresAt,
      accessPending: !entitlement && payment.status !== "REFUNDED",
      isExpired: payment.status === "REFUNDED" || !accessActive,
    }];
  });
}
