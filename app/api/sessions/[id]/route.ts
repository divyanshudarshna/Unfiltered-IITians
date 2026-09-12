import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Await params
    const { id } = await context.params;

    const session = await prisma.session.findFirst({
      where: { id, status: "PUBLISHED" },
      include: {
        testimonials: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            youtubeUrl: true,
            youtubeVideoId: true,
            name: true,
            sessionAttended: true,
            description: true,
            rating: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const recurringPlan = session.billingMode === "RECURRING" && session.subscriptionEnabled
      ? await prisma.commerceBillingPlan.findFirst({
        where: {
          productType: "GUIDANCE_SESSION",
          productId: session.id,
          status: "ACTIVE",
          providerSyncState: "ACTIVE",
        },
        orderBy: { version: "desc" },
        select: { amountPaise: true, currency: true, interval: true, totalCount: true },
      })
      : null;

    return NextResponse.json({
      ...session,
      recurringPlan,
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
