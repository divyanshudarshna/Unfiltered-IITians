const MAX_PLAN_CYCLES = 120;

export type CourseBillingConfig = {
  billingMode: "ONE_TIME" | "RECURRING";
  subscriptionEnabled: boolean;
  amountPaise: number | null;
  interval: "monthly";
  totalCount: number;
};

export class CourseBillingInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CourseBillingInputError";
  }
}

function hasOwn(input: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

export function hasCourseBillingInput(input: Record<string, unknown>) {
  return [
    "billingMode",
    "subscriptionEnabled",
    "subscriptionAmount",
    "subscriptionInterval",
    "subscriptionTotalCount",
  ].some((key) => hasOwn(input, key));
}

export function parseRupeesToPaise(value: unknown) {
  const text = typeof value === "number" ? String(value) : String(value ?? "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    throw new CourseBillingInputError("Subscription amount must be a valid INR amount with up to two decimals");
  }

  const [rupees, paise = ""] = text.split(".");
  const amountPaise = Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 100) {
    throw new CourseBillingInputError("Subscription amount must be at least ₹1");
  }

  return amountPaise;
}

export function calculateCourseSubscriptionTotalPaise(amount: unknown, totalCount: unknown) {
  const cycles = Number(totalCount);
  if (!Number.isInteger(cycles) || cycles < 1 || cycles > MAX_PLAN_CYCLES) {
    throw new CourseBillingInputError(`Subscription cycles must be a whole number from 1 to ${MAX_PLAN_CYCLES}`);
  }

  const totalPaise = parseRupeesToPaise(amount) * cycles;
  if (!Number.isSafeInteger(totalPaise)) {
    throw new CourseBillingInputError("Subscription total is too large");
  }

  return totalPaise;
}

export function normalizeCourseBillingInput(input: Record<string, unknown>): CourseBillingConfig {
  if (!hasCourseBillingInput(input)) {
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
    throw new CourseBillingInputError("Invalid course billing mode");
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
    throw new CourseBillingInputError("Recurring courses must use recurring billing mode");
  }

  const interval = input.subscriptionInterval ?? "monthly";
  if (interval !== "monthly") {
    throw new CourseBillingInputError("Only monthly course subscriptions are supported");
  }

  const totalCount = Number(input.subscriptionTotalCount ?? MAX_PLAN_CYCLES);
  if (!Number.isInteger(totalCount) || totalCount < 1 || totalCount > MAX_PLAN_CYCLES) {
    throw new CourseBillingInputError(`Subscription cycles must be a whole number from 1 to ${MAX_PLAN_CYCLES}`);
  }

  return {
    billingMode: "RECURRING",
    subscriptionEnabled: true,
    amountPaise: parseRupeesToPaise(input.subscriptionAmount),
    interval: "monthly",
    totalCount,
  };
}

export function isSameCourseBillingPlan(
  plan: { amountPaise: number; currency: string; interval: string; totalCount: number },
  config: CourseBillingConfig,
) {
  return (
    config.amountPaise !== null &&
    plan.amountPaise === config.amountPaise &&
    plan.currency === "INR" &&
    plan.interval === config.interval &&
    plan.totalCount === config.totalCount
  );
}
