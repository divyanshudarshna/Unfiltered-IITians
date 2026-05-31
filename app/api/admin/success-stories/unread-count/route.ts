import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

export async function GET(req: Request) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    const count = await prisma.studentSuccessStory.count({
      where: {
        submittedViaForm: true,
        approvalStatus: {
          in: ["pending", "rejected"],
        },
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Error fetching unread success story count:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread success story count" },
      { status: 500 }
    );
  }
}
