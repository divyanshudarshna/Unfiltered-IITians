// app/api/billing/test/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    
    
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({
        success: false,
        step: "auth",
        error: "No user found"
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
      select: { id: true, email: true }
    });

    if (!dbUser) {
      return NextResponse.json({
        success: false,
        step: "db_user",
        error: "User not found in database"
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        clerkId: user.id,
        dbId: dbUser.id,
        email: dbUser.email
      }
    });

  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
