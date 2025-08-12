// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

async function adminAuth() {
  // ✅ TEMP: bypass authentication for testing
  console.log("⚠️ Skipping auth checks for testing");
  return { id: "test-admin", role: "ADMIN" };
}

export async function GET() {
  try {
    await adminAuth();

    const users = await prisma.user.findMany({
      include: {
        enrollments: { include: { course: true } },
        mockAttempts: { include: { mockTest: true } },
      },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Error in admin GET users:", error);
    return NextResponse.json(
      { 
        error: error.message || "Internal Server Error",
        details: error.message.includes("Unauthorized") 
          ? "Authentication failed" 
          : "Server error"
      },
      { 
        status: error.message.includes("Unauthorized") ? 401 : 500 
      }
    );
  }
}