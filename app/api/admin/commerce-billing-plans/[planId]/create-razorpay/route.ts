import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, getDbUserFromClerk, handleAuthError } from "@/lib/roleAuth";
import { assertRazorpayServerConfiguration, razorpay } from "@/lib/razorpay";
import {
  buildRazorpayPlanCreateInput,
  getRazorpayPlanCreationDecision,
  RazorpayPlanValidationError,
  validateRazorpayPlanMatch,
} from "@/lib/razorpay-plan";

export const runtime = "nodejs";

function getRequiredPermission(productType: string) {
  if (productType === "MOCK_TEST") return "mocks" as const;
  if (productType === "MOCK_BUNDLE") return "mock_bundles" as const;
  if (productType === "GUIDANCE_SESSION") return "sessions" as const;
  return null;
}

async function getProductDetails(productType: string, productId: string) {
  if (productType === "MOCK_TEST") {
    return prisma.mockTest.findUnique({ where: { id: productId }, select: { title: true, description: true, billingMode: true, subscriptionEnabled: true } });
  }
  if (productType === "MOCK_BUNDLE") {
    return prisma.mockBundle.findUnique({ where: { id: productId }, select: { title: true, description: true, billingMode: true, subscriptionEnabled: true } });
  }
  if (productType === "GUIDANCE_SESSION") {
    return prisma.session.findUnique({ where: { id: productId }, select: { title: true, description: true, billingMode: true, subscriptionEnabled: true } });
  }
  return null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  try {
    if (!await getDbUserFromClerk()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { planId } = await params;
    const plan = await prisma.commerceBillingPlan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Billing plan not found" }, { status: 404 });
    const requiredPermission = getRequiredPermission(plan.productType);
    if (!requiredPermission) return NextResponse.json({ error: "Unsupported billing product" }, { status: 400 });
    await assertAdminApiAccess(req.url, req.method, requiredPermission);
    const latestPlan = await prisma.commerceBillingPlan.findFirst({
      where: { productType: plan.productType, productId: plan.productId },
      orderBy: { version: "desc" },
      select: { id: true },
    });
    if (latestPlan?.id !== plan.id) {
      return NextResponse.json({ error: "Only the latest billing-plan version can be activated" }, { status: 409 });
    }

    const product = await getProductDetails(plan.productType, plan.productId);
    if (!product) return NextResponse.json({ error: "Paid resource not found" }, { status: 404 });
    if (product.billingMode !== "RECURRING" || !product.subscriptionEnabled) {
      return NextResponse.json({ error: "Recurring subscriptions are disabled for this resource" }, { status: 409 });
    }
    const creationDecision = getRazorpayPlanCreationDecision(plan);
    if (creationDecision === "ALREADY_LINKED") {
      return NextResponse.json({ error: "This billing plan is already linked to Razorpay" }, { status: 409 });
    }
    if (creationDecision === "BLOCKED") {
      return NextResponse.json({ error: "This billing plan cannot create a provider plan in its current state" }, { status: 409 });
    }

    assertRazorpayServerConfiguration();
    const claim = await prisma.commerceBillingPlan.updateMany({
      where: {
        id: plan.id,
        razorpayPlanId: null,
        providerSyncState: "PENDING",
        status: { not: "INACTIVE" },
      },
      data: { providerSyncState: "CREATING" },
    });
    if (claim.count !== 1) {
      return NextResponse.json(
        { error: "Plan creation is already running or requires manual review. Refresh before trying again." },
        { status: 409 },
      );
    }

    let providerPlanId: string | undefined;
    try {
      const providerPlan = await razorpay.plans.create(buildRazorpayPlanCreateInput(plan, {
        name: `${product.title} - Monthly`,
        description: product.description ?? undefined,
        localPlanId: plan.id,
        productType: plan.productType,
        productId: plan.productId,
      }));
      providerPlanId = providerPlan.id;
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
          data: {
            razorpayPlanId: providerPlan.id,
            providerSyncState: "ACTIVE",
            status: "ACTIVE",
          },
        });
      });

      return NextResponse.json({ billingPlan, created: true });
    } catch (error) {
      await prisma.commerceBillingPlan.updateMany({
        where: { id: plan.id, providerSyncState: "CREATING" },
        data: {
          providerSyncState: "CREATE_REVIEW_REQUIRED",
          ...(providerPlanId ? { razorpayPlanId: providerPlanId } : {}),
        },
      }).catch((recoveryError) => console.error("Failed to record Razorpay plan recovery state:", recoveryError));

      console.error("Failed to create and activate Razorpay commerce plan:", error);
      return NextResponse.json(
        {
          error: "Plan creation could not be finalized. Check Razorpay Plans before retrying; if a plan exists, use Verify Existing Plan ID.",
          ...(providerPlanId ? { razorpayPlanId: providerPlanId } : {}),
        },
        { status: 502 },
      );
    }
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    if (error instanceof RazorpayPlanValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Razorpay server configuration is missing") {
      return NextResponse.json({ error: "Payment provider is not configured" }, { status: 503 });
    }
    console.error("Failed to prepare Razorpay commerce plan creation:", error);
    return NextResponse.json({ error: "Unable to create Razorpay billing plan" }, { status: 502 });
  }
}
