// app/api/users/route.ts
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // ✅ auth() is async in Next.js App Router
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ get full Clerk user profile
    const clerkUser = await currentUser();

    // ✅ look up user in Prisma
    let user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        id: true,
        name: true,
        email: true,
        profileImageUrl: true,
        role: true,
        createdAt: true,
      },
    });

    // 🔄 auto-create if not found
    if (!user && clerkUser) {
      user = await prisma.user.create({
        data: {
          clerkUserId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
          name: clerkUser.fullName ?? "",
          profileImageUrl: clerkUser.imageUrl ?? null,
          role: "STUDENT", // default role
        },
        select: {
          id: true,
          name: true,
          email: true,
          profileImageUrl: true,
          role: true,
          createdAt: true,
        },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("API /api/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
