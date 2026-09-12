type LocalBillingPlan = {
  amountPaise: number;
  currency: string;
  interval: string;
};

type ProviderPlan = {
  item?: { amount?: number | string; currency?: string };
  period?: string;
  interval?: number;
};

type RazorpayPlanMetadata = {
  name: string;
  description?: string | null;
  localPlanId: string;
  productType: string;
  productId: string;
};

type LocalPlanCreationState = {
  status: string;
  providerSyncState: string;
  razorpayPlanId?: string | null;
};

export class RazorpayPlanValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RazorpayPlanValidationError";
  }
}

export function validateRazorpayPlanMatch(localPlan: LocalBillingPlan, providerPlan: ProviderPlan) {
  const providerAmount = Number(providerPlan.item?.amount);
  const providerCurrency = providerPlan.item?.currency?.toUpperCase();
  const providerPeriod = providerPlan.period?.toLowerCase();

  if (!Number.isInteger(providerAmount) || providerAmount !== localPlan.amountPaise) {
    throw new RazorpayPlanValidationError("Razorpay plan amount does not match the local billing plan");
  }
  if (providerCurrency !== localPlan.currency.toUpperCase()) {
    throw new RazorpayPlanValidationError("Razorpay plan currency does not match the local billing plan");
  }
  if (providerPeriod !== localPlan.interval.toLowerCase() || providerPlan.interval !== 1) {
    throw new RazorpayPlanValidationError("Razorpay plan billing interval does not match the local billing plan");
  }
}

export function buildRazorpayPlanCreateInput(localPlan: LocalBillingPlan, metadata: RazorpayPlanMetadata) {
  if (
    !Number.isInteger(localPlan.amountPaise)
    || localPlan.amountPaise < 100
    || localPlan.currency.toUpperCase() !== "INR"
    || localPlan.interval.toLowerCase() !== "monthly"
  ) {
    throw new RazorpayPlanValidationError("Only valid monthly INR billing plans can be created in Razorpay");
  }

  const name = metadata.name.trim().slice(0, 255);
  if (!name) throw new RazorpayPlanValidationError("Razorpay plan name is required");
  const description = metadata.description?.trim().slice(0, 255);

  return {
    period: "monthly" as const,
    interval: 1,
    item: {
      name,
      amount: localPlan.amountPaise,
      currency: "INR",
      ...(description ? { description } : {}),
    },
    notes: {
      local_plan_id: metadata.localPlanId,
      product_type: metadata.productType,
      product_id: metadata.productId,
      managed_by: "unfiltered_iitians_admin",
    },
  };
}

export function getRazorpayPlanCreationDecision(plan: LocalPlanCreationState) {
  if (plan.razorpayPlanId) return "ALREADY_LINKED" as const;
  if (plan.status === "INACTIVE" || plan.providerSyncState !== "PENDING") return "BLOCKED" as const;
  return "CREATE" as const;
}

/**
 * A creation lock can survive a network or deployment interruption before a
 * provider Plan ID is recorded. Resetting is intentionally opt-in and only
 * permitted after an administrator confirms Razorpay has no matching plan.
 */
export function getRazorpayPlanRecoveryDecision(plan: LocalPlanCreationState) {
  if (plan.razorpayPlanId || plan.status !== "DRAFT") return "BLOCKED" as const;
  if (plan.providerSyncState === "CREATING" || plan.providerSyncState === "CREATE_REVIEW_REQUIRED") {
    return "RESET" as const;
  }
  return "BLOCKED" as const;
}
