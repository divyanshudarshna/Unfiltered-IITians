import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";
import { assertRazorpayServerConfiguration, razorpay } from "@/lib/razorpay";
import {
  buildRazorpayPlanCreateInput,
  getRazorpayPlanCreationDecision,
  RazorpayPlanValidationError,
  validateRazorpayPlanMatch,
} from "@/lib/razorpay-plan";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; planId: string }> },
) {
  try {
    await assertAdminApiAccess(req.url, req.method, "courses");
    const { id: courseId, planId } = await params;
    const plan = await prisma.courseBillingPlan.findFirst({
      where: { id: planId, courseId },
      include: {
        course: {
          select: { title: true, description: true, billingMode: true, subscriptionEnabled: true },
        },
      },
    });

    if (!plan) return NextResponse.json({ error: "Billing plan not found" }, { status: 404 });
    const latestPlan = await prisma.courseBillingPlan.findFirst({
      where: { courseId },
      orderBy: { version: "desc" },
      select: { id: true },
    });
    if (latestPlan?.id !== plan.id) {
      return NextResponse.json({ error: "Only the latest billing-plan version can be activated" }, { status: 409 });
    }
    if (plan.course.billingMode !== "RECURRING" || !plan.course.subscriptionEnabled) {
      return NextResponse.json({ error: "Recurring subscriptions are disabled for this course" }, { status: 409 });
    }
    const creationDecision = getRazorpayPlanCreationDecision(plan);
    if (creationDecision === "ALREADY_LINKED") {
      return NextResponse.json({ error: "This billing plan is already linked to Razorpay" }, { status: 409 });
    }
    if (creationDecision === "BLOCKED") {
      return NextResponse.json({ error: "This billing plan cannot create a provider plan in its current state" }, { status: 409 });
    }

    assertRazorpayServerConfiguration();
    const claim = await prisma.courseBillingPlan.updateMany({
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
        name: `${plan.course.title} - Monthly`,
        description: plan.course.description,
        localPlanId: plan.id,
        productType: "COURSE",
        productId: courseId,
      }));
      providerPlanId = providerPlan.id;
      validateRazorpayPlanMatch(plan, providerPlan);

      const billingPlan = await prisma.$transaction(async (tx) => {
        await tx.courseBillingPlan.updateMany({
          where: { courseId, id: { not: plan.id }, status: "ACTIVE" },
          data: { status: "INACTIVE" },
        });
        return tx.courseBillingPlan.update({
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
      await prisma.courseBillingPlan.updateMany({
        where: { id: plan.id, providerSyncState: "CREATING" },
        data: {
          providerSyncState: "CREATE_REVIEW_REQUIRED",
          ...(providerPlanId ? { razorpayPlanId: providerPlanId } : {}),
        },
      }).catch((recoveryError) => console.error("Failed to record Razorpay plan recovery state:", recoveryError));

      console.error("Failed to create and activate Razorpay course plan:", error);
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
    console.error("Failed to prepare Razorpay course plan creation:", error);
    return NextResponse.json({ error: "Unable to create Razorpay billing plan" }, { status: 502 });
  }
}
