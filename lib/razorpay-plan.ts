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
