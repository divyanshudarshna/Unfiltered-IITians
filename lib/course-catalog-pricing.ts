interface RecurringPlan {
  amountPaise: number;
  interval: string;
  totalCount: number;
}

interface CourseCatalogPriceInput {
  price: number;
  actualPrice?: number | null;
  billingMode?: string;
  subscriptionEnabled?: boolean;
  recurringPlan?: RecurringPlan | null;
}

export type CourseCatalogPricing = {
  kind: "ONE_TIME" | "RECURRING";
  amountRupees: number;
  suffix: "/month" | null;
  regularRupees: number | null;
  discountPercent: number;
};

export function getCourseCatalogPricing(course: CourseCatalogPriceInput): CourseCatalogPricing {
  if (
    course.billingMode === "RECURRING" &&
    course.subscriptionEnabled &&
    course.recurringPlan?.interval === "monthly"
  ) {
    return {
      kind: "RECURRING",
      amountRupees: course.recurringPlan.amountPaise / 100,
      suffix: "/month",
      regularRupees: null,
      discountPercent: 0,
    };
  }

  const hasDiscount =
    course.actualPrice !== null &&
    course.actualPrice !== undefined &&
    course.actualPrice < course.price;
  const amountRupees = hasDiscount ? course.actualPrice! : course.price;
  const discountPercent = hasDiscount
    ? Math.round(((course.price - amountRupees) / course.price) * 100)
    : 0;

  return {
    kind: "ONE_TIME",
    amountRupees,
    suffix: null,
    regularRupees: hasDiscount ? course.price : null,
    discountPercent,
  };
}
