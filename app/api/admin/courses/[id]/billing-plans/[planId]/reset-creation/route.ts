import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";
import { getRazorpayPlanRecoveryDecision } from "@/lib/razorpay-plan";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; planId: string }> },
) {
  try {
    await assertAdminApiAccess(req.url, req.method, "courses");
    const { id: courseId, planId } = await params;
    const body = await req.json().catch(() => null);
    if (body?.confirmedNoProviderPlan !== true) {
      return NextResponse.json(
        { error: "Confirm that Razorpay has no matching plan before resetting creation" },
        { status: 400 },
      );
    }

    const plan = await prisma.courseBillingPlan.findFirst({
      where: { id: planId, courseId },
      include: { course: { select: { billingMode: true, subscriptionEnabled: true } } },
    });
    if (!plan) return NextResponse.json({ error: "Billing plan not found" }, { status: 404 });
    if (plan.course.billingMode !== "RECURRING" || !plan.course.subscriptionEnabled) {
      return NextResponse.json({ error: "Recurring subscriptions are disabled for this course" }, { status: 409 });
    }

    const latestPlan = await prisma.courseBillingPlan.findFirst({
      where: { courseId },
      orderBy: { version: "desc" },
      select: { id: true },
    });
    if (latestPlan?.id !== plan.id) {
      return NextResponse.json({ error: "Only the latest billing-plan version can be recovered" }, { status: 409 });
    }
    if (getRazorpayPlanRecoveryDecision(plan) !== "RESET") {
      return NextResponse.json(
        { error: "This billing plan is not eligible for creation recovery" },
        { status: 409 },
      );
    }

    const reset = await prisma.courseBillingPlan.updateMany({
      where: {
        id: plan.id,
        razorpayPlanId: null,
        status: "DRAFT",
        providerSyncState: { in: ["CREATING", "CREATE_REVIEW_REQUIRED"] },
      },
      data: { providerSyncState: "PENDING" },
    });
    if (reset.count !== 1) {
      return NextResponse.json(
        { error: "Billing plan state changed. Refresh before trying again." },
        { status: 409 },
      );
    }

    return NextResponse.json({ recovered: true });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Failed to recover Razorpay course plan creation:", error);
    return NextResponse.json({ error: "Unable to recover Razorpay plan creation" }, { status: 502 });
  }
}
