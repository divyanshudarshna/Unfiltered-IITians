import { type Prisma, type CommerceProductType } from "@prisma/client";
import {
  isSameCommerceBillingPlan,
  type CommerceBillingConfig,
} from "@/lib/commerce-billing";

export async function createOrVersionCommerceBillingPlan(
  tx: Prisma.TransactionClient,
  input: {
    productType: Exclude<CommerceProductType, "COURSE">;
    productId: string;
    billing: CommerceBillingConfig;
  },
) {
  if (!input.billing.subscriptionEnabled || input.billing.amountPaise === null) return null;

  const latest = await tx.commerceBillingPlan.findFirst({
    where: { productType: input.productType, productId: input.productId },
    orderBy: { version: "desc" },
  });
  if (latest && isSameCommerceBillingPlan(latest, input.billing)) return latest;

  return tx.commerceBillingPlan.create({
    data: {
      productType: input.productType,
      productId: input.productId,
      version: (latest?.version ?? 0) + 1,
      status: "DRAFT",
      amountPaise: input.billing.amountPaise,
      currency: "INR",
      interval: input.billing.interval,
      totalCount: input.billing.totalCount,
      providerSyncState: "PENDING",
    },
  });
}
