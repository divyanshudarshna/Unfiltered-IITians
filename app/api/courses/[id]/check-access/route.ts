// app/api/courses/[id]/check-access/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCourseEntitlement } from "@/lib/courseAccess";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { userId: clerkUserId } = await auth();
    const { id: courseId } = await params;
    if (!clerkUserId) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: "Not authenticated",
        redirectTo: "/sign-in"
      }, { status: 401 });
    }

    const entitlement = await getCourseEntitlement(clerkUserId, courseId)
    if (!entitlement.userId) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: "User not found",
        redirectTo: "/courses"
      }, { status: 404 });
    }

    if (!entitlement.hasFullAccess) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: "Not enrolled in this course",
        redirectTo: "/courses"
      }, { status: 403 });
    }

    return NextResponse.json({ 
      hasAccess: true,
      isAdmin: entitlement.role === "ADMIN",
      isStaff: entitlement.accessSource === "role",
      enrollmentExpiresAt: entitlement.enrollmentExpiresAt,
    });

  } catch (error) {
    console.error("❌ Error checking course access:", error);
    return NextResponse.json({ 
      hasAccess: false, 
      reason: "Internal server error",
      redirectTo: "/courses"
    }, { status: 500 });
  }
}
