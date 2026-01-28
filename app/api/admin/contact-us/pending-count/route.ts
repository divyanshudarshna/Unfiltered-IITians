import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { assertAdminApiAccess } from "@/lib/roleAuth";

export async function GET(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    // Count pending contact messages
    const count = await prisma.contactUs.count({
      where: {
        status: "PENDING"
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching pending contact count:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending contact count" },
      { status: 500 }
    );
  }
}
