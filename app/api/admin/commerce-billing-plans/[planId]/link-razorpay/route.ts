import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";
import { assertRazorpayServerConfiguration, razorpay } from "@/lib/razorpay";
import { RazorpayPlanValidationError, validateRazorpayPlanMatch } from "@/lib/razorpay-plan";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  try {
    await assertAdminApiAccess(req.url, req.method, "courses");
    const { planId } = await params;
    const body = await req.json();
    const razorpayPlanId = typeof body.razorpayPlanId === "string" ? body.razorpayPlanId.trim() : "";
    if (!razorpayPlanId) return NextResponse.json({ error: "Razorpay plan ID is required" }, { status: 400 });

    const plan = await prisma.commerceBillingPlan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Billing plan not found" }, { status: 404 });
    if (plan.status === "INACTIVE") {
      return NextResponse.json({ error: "Inactive billing plans cannot be linked" }, { status: 409 });
    }
    const duplicate = await prisma.commerceBillingPlan.findFirst({
      where: { razorpayPlanId, id: { not: plan.id } },
      select: { id: true },
    });
    if (duplicate) return NextResponse.json({ error: "This Razorpay plan is already linked" }, { status: 409 });

    assertRazorpayServerConfiguration();
    const providerPlan = await razorpay.plans.fetch(razorpayPlanId);
    if (providerPlan.id !== razorpayPlanId) {
      return NextResponse.json({ error: "Razorpay returned an unexpected billing plan" }, { status: 502 });
    }
    validateRazorpayPlanMatch(plan, providerPlan);

    const billingPlan = await prisma.$transaction(async (tx) => {
      await tx.commerceBillingPlan.updateMany({
        where: {
          productType: plan.productType,
          productId: plan.productId,
          id: { not: plan.id },
          status: "ACTIVE",
        },
        data: { status: "INACTIVE" },
      });
      return tx.commerceBillingPlan.update({
        where: { id: plan.id },
        data: { razorpayPlanId, providerSyncState: "ACTIVE", status: "ACTIVE" },
      });
    });
    return NextResponse.json({ billingPlan });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    if (error instanceof RazorpayPlanValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Razorpay server configuration is missing") {
      return NextResponse.json({ error: "Payment provider is not configured" }, { status: 503 });
    }
    console.error("Failed to link Razorpay billing plan:", error);
    return NextResponse.json({ error: "Unable to verify Razorpay billing plan" }, { status: 502 });
  }
}
