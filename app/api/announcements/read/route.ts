import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(req);

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipientId } = await req.json();

    if (!recipientId) {
      return NextResponse.json(
        { error: "recipientId is required" },
        { status: 400 }
      );
    }

    // Find user in DB
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Mark recipient as read (must belong to this user)
    const updated = await prisma.announcementRecipient.updateMany({
      where: {
        id: recipientId,
        userId: user.id,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { error: "Recipient not found or not owned by user" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Announcement marked as read",
    });
  } catch (err) {
    console.error("Error marking announcement as read:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
