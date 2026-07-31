import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    const subscriptionId = params.id;
    const data = await req.json();

    if (typeof data.paid !== "boolean") {
      return NextResponse.json({ error: "Missing or invalid 'paid' field" }, { status: 400 });
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        paid: data.paid,
      },
    });

    return NextResponse.json({ subscription: updatedSubscription });
  } catch (error: any) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
