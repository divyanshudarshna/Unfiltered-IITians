import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUserFromClerk } from "@/lib/roleAuth";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getDbUserFromClerk();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const checkout = await prisma.commerceCheckout.findFirst({
    where: { id, userId: user.id },
  });
  if (!checkout) return NextResponse.json({ error: "Checkout not found" }, { status: 404 });

  const now = new Date();
  const entitlement = await prisma.entitlement.findFirst({
    where: {
      userId: user.id,
      resourceType: checkout.productType,
      resourceId: checkout.productId,
      status: "ACTIVE",
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    select: { id: true, startsAt: true, endsAt: true },
  });

  return NextResponse.json({
    checkout: {
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
    },
    entitlement: entitlement
      ? { active: true, startsAt: entitlement.startsAt, endsAt: entitlement.endsAt }
      : { active: false },
  });
}
