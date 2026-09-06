import { parseRupeesToPaise } from "@/lib/commerce-checkout";

const MAX_PLAN_CYCLES = 120;

export type CommerceBillingConfig = {
  billingMode: "ONE_TIME" | "RECURRING";
  subscriptionEnabled: boolean;
  amountPaise: number | null;
  interval: "monthly";
  totalCount: number;
};

export class CommerceBillingInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommerceBillingInputError";
  }
}

function hasOwn(input: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

export function hasCommerceBillingInput(input: Record<string, unknown>) {
  return [
    "billingMode",
    "subscriptionEnabled",
    "subscriptionAmount",
    "subscriptionInterval",
    "subscriptionTotalCount",
  ].some((key) => hasOwn(input, key));
}

export function normalizeCommerceBillingInput(input: Record<string, unknown>): CommerceBillingConfig {
  if (!hasCommerceBillingInput(input)) {
    return {
      billingMode: "ONE_TIME",
      subscriptionEnabled: false,
      amountPaise: null,
      interval: "monthly",
      totalCount: MAX_PLAN_CYCLES,
    };
  }

  const billingMode = input.billingMode ?? (input.subscriptionEnabled === true ? "RECURRING" : "ONE_TIME");
  if (billingMode !== "ONE_TIME" && billingMode !== "RECURRING") {
    throw new CommerceBillingInputError("Invalid billing mode");
  }

  const subscriptionEnabled = input.subscriptionEnabled === true || billingMode === "RECURRING";
  if (!subscriptionEnabled) {
    return {
      billingMode: "ONE_TIME",
      subscriptionEnabled: false,
      amountPaise: null,
      interval: "monthly",
      totalCount: MAX_PLAN_CYCLES,
    };
  }

  if (billingMode !== "RECURRING") {
    throw new CommerceBillingInputError("Recurring products must use recurring billing mode");
  }
  if ((input.subscriptionInterval ?? "monthly") !== "monthly") {
    throw new CommerceBillingInputError("Only monthly subscriptions are supported");
  }

  const totalCount = Number(input.subscriptionTotalCount ?? MAX_PLAN_CYCLES);
  if (!Number.isInteger(totalCount) || totalCount < 1 || totalCount > MAX_PLAN_CYCLES) {
    throw new CommerceBillingInputError(`Subscription cycles must be a whole number from 1 to ${MAX_PLAN_CYCLES}`);
  }

  try {
    return {
      billingMode: "RECURRING",
      subscriptionEnabled: true,
      amountPaise: parseRupeesToPaise(input.subscriptionAmount),
      interval: "monthly",
      totalCount,
    };
  } catch (error) {
    if (error instanceof Error) throw new CommerceBillingInputError(error.message);
    throw error;
  }
}

export function isSameCommerceBillingPlan(
  plan: { amountPaise: number; currency: string; interval: string; totalCount: number },
  config: CommerceBillingConfig,
) {
  return config.amountPaise !== null
    && plan.amountPaise === config.amountPaise
    && plan.currency === "INR"
    && plan.interval === config.interval
    && plan.totalCount === config.totalCount;
}
