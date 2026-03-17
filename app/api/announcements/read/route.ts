// app/api/announcements/read/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { announcementId } = await req.json();
    if (!announcementId) {
      return new NextResponse("Missing announcementId", { status: 400 });
    }

    // Map Clerk ID → internal User ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: clerkUser.id }, // ✅ correct field
      select: { id: true },
    });

    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    // Mark announcement as read for this user.
    // Use upsert so that users who enrolled after the announcement was sent
    // (and therefore have no AnnouncementRecipient row yet) are handled
    // correctly — updateMany would silently do nothing for them.
    await prisma.announcementRecipient.upsert({
      where: {
        announcementId_userId: {
          announcementId,
          userId: dbUser.id,
        },
      },
      update: {
        read: true,
        readAt: new Date(),
      },
      create: {
        announcementId,
        userId: dbUser.id,
        read: true,
        readAt: new Date(),
        deliveredEmail: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/announcements/read error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
