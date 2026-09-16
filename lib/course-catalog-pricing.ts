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
  oneTimeOption: {
    amountRupees: number;
    regularRupees: number | null;
    discountPercent: number;
    savingsRupees: number;
  } | null;
};

export function getCourseCatalogPricing(course: CourseCatalogPriceInput): CourseCatalogPricing {
  const hasDiscount =
    course.actualPrice !== null &&
    course.actualPrice !== undefined &&
    course.actualPrice < course.price;
  const oneTimeAmountRupees = hasDiscount ? course.actualPrice! : course.price;
  const oneTimeRegularRupees = hasDiscount ? course.price : null;
  const oneTimeDiscountPercent = hasDiscount
    ? Math.round(((course.price - oneTimeAmountRupees) / course.price) * 100)
    : 0;

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
      oneTimeOption: {
        amountRupees: oneTimeAmountRupees,
        regularRupees: oneTimeRegularRupees,
        discountPercent: oneTimeDiscountPercent,
        savingsRupees: oneTimeRegularRupees
          ? oneTimeRegularRupees - oneTimeAmountRupees
          : 0,
      },
    };
  }

  return {
    kind: "ONE_TIME",
    amountRupees: oneTimeAmountRupees,
    suffix: null,
    regularRupees: oneTimeRegularRupees,
    discountPercent: oneTimeDiscountPercent,
    oneTimeOption: null,
  };
}
