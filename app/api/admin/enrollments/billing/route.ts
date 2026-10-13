import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AdminCourseActionError, executeAdminCourseAction, getAdminCourseBilling } from "@/lib/admin-course-actions";

export const runtime = "nodejs";
export const maxDuration = 60;
const objectId = /^[a-f\d]{24}$/i;
const uuid = /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i;

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new AdminCourseActionError("Unauthorized", 401);
  const user = await prisma.user.findUnique({ where: { clerkUserId: userId }, select: { id: true, role: true } });
  if (user?.role !== "ADMIN") throw new AdminCourseActionError("Admin access required", 403);
  return user;
}
function errorResponse(error: unknown) {
  if (error instanceof AdminCourseActionError) return NextResponse.json({ error: error.message }, { status: error.status });
  // Never return provider objects, credentials, or stack traces to the browser.
  return NextResponse.json({ error: "Unable to verify billing. No successful action is confirmed; retry the same request or check the payment dashboard." }, { status: 503 });
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const courseId = req.nextUrl.searchParams.get("courseId") ?? "";
    if (!objectId.test(courseId)) throw new AdminCourseActionError("Invalid course ID", 400);
    if (req.nextUrl.searchParams.get("reviews") === "true") {
      const search = (req.nextUrl.searchParams.get("search") ?? "").trim().slice(0, 200);
      const checkouts = await prisma.commerceCheckout.findMany({
        where: { productType: "COURSE", productId: courseId, status: { in: ["REQUIRES_REVIEW", "CANCELLED"] }, ...(search ? { user: { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } } : {}) },
        include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { updatedAt: "desc" }, take: 50,
      });
      const payments = await prisma.commercePayment.findMany({ where: { checkoutId: { in: checkouts.map(row => row.id) }, status: { in: ["CAPTURED", "REFUNDED", "PARTIALLY_REFUNDED"] } }, select: { checkoutId: true, status: true } });
      const paidIds = new Set(payments.map(row => row.checkoutId));
      const capturedIds = new Set(payments.filter(row => row.status === "CAPTURED").map(row => row.checkoutId));
      const pendingJobs = await prisma.billingOutbox.findMany({ where: { action: "ADMIN_COURSE_ACTION", status: { in: ["FAILED", "PROCESSING"] } }, orderBy: { updatedAt: "desc" }, take: 200 });
      const pendingCheckoutIds = new Set(pendingJobs.flatMap(job => {
        const payload = job.payload as { scope?: { checkoutIds?: string[] } };
        return payload.scope?.checkoutIds ?? [];
      }));
      return NextResponse.json({ checkouts: checkouts.filter(row => (row.status === "REQUIRES_REVIEW" && capturedIds.has(row.id)) || (pendingCheckoutIds.has(row.id) && paidIds.has(row.id))).map(row => ({ id: row.id, user: row.user, courseId: row.productId, amountPaise: row.amountPaise, currency: row.currency })) });
    }
    const userId = req.nextUrl.searchParams.get("userId") ?? "";
    if (!objectId.test(userId)) throw new AdminCourseActionError("Invalid user ID", 400);
    return NextResponse.json(await getAdminCourseBilling(userId, courseId, new Date(), admin.id));
  } catch (error) { return errorResponse(error); }
}

export async function POST(req: NextRequest) {
  let requestId: string | undefined;
  try {
    const admin = await requireAdmin();
    const origin = req.headers.get("origin");
    if (origin && origin !== req.nextUrl.origin) throw new AdminCourseActionError("Invalid request origin", 403);
    const body = await req.json().catch(() => null);
    if (!body || !objectId.test(body.userId ?? "") || !objectId.test(body.courseId ?? "") || !uuid.test(body.requestId ?? "")
      || !["TERMINATE", "TERMINATE_REFUND"].includes(body.action) || body.confirmation !== "TERMINATE"
      || typeof body.reason !== "string" || body.reason.trim().length < 5 || body.reason.length > 500
      || (body.action === "TERMINATE_REFUND" && (typeof body.paymentId !== "string" || !/^pay_[a-zA-Z0-9]+$/.test(body.paymentId)))) {
      throw new AdminCourseActionError("Confirm termination, provide a reason, and select an owned payment for refunds", 400);
    }
    requestId = body.requestId;
    const result = await executeAdminCourseAction({ userId: body.userId, courseId: body.courseId, actorId: admin.id,
      action: body.action, ...(body.action === "TERMINATE_REFUND" ? { paymentId: body.paymentId } : {}), reason: body.reason.trim(), requestId: body.requestId });
    return NextResponse.json(result, { status: result.pending ? 202 : 200 });
  } catch (error) {
    const response = errorResponse(error);
    if (!requestId) return response;
    let retryRequired = true;
    try {
      retryRequired = Boolean(await prisma.billingOutbox.findUnique({ where: { dedupeKey: `admin-course-action:${requestId}` }, select: { id: true } }));
    } catch { /* Unknown database state must retain the original retry ID. */ }
    return NextResponse.json({ ...(await response.json()), retryRequired }, { status: response.status });
  }
}
