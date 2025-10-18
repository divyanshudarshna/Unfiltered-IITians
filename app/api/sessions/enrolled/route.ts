// app/api/sessions/enrolled/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ sessionIds: [] });

    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
      include: { 
        sessionEnrollments: {
          where: {
            paymentStatus: "SUCCESS" // ✅ Only include successfully paid enrollments
          }
        }
      },
    });

    if (!dbUser) return NextResponse.json({ sessionIds: [] });

    const sessionIds = dbUser.sessionEnrollments.map((e) => e.sessionId);

    return NextResponse.json({ sessionIds });
  } catch (err) {
    console.error("❌ Error fetching enrolled sessions:", err);
    return NextResponse.json({ sessionIds: [] }, { status: 500 });
  }
}
