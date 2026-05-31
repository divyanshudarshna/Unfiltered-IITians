import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/admin/success-stories/[id]/approve
// Body: { action: "approve" | "reject", approvalNotes?: string }
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { id } = await params;

    const body = await req.json();
    const {
      action,
      approvalNotes,
    }: {
      action: "approve" | "reject";
      approvalNotes?: string;
    } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const existing = await prisma.studentSuccessStory.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const updated = await prisma.studentSuccessStory.update({
      where: { id },
      data:
        action === "approve"
          ? {
              approvalStatus: "approved",
              isApproved: true,
              approvedAt: new Date(),
              approvalNotes: approvalNotes?.trim() || null,
            }
          : {
              approvalStatus: "rejected",
              isApproved: false,
              approvedAt: null,
              approvalNotes: approvalNotes?.trim() || null,
            },
    });

    return NextResponse.json({ success: true, story: updated });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("❌ POST /api/admin/success-stories/[id]/approve:", error);
    return NextResponse.json({ error: "Failed to update story approval status" }, { status: 500 });
  }
}
