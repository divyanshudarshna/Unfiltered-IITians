// app/api/courses/[id]/check-access/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: "Not authenticated",
        redirectTo: "/sign-in"
      }, { status: 401 });
    }

    // Map Clerk user → DB user
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    });
    if (!user) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: "User not found",
        redirectTo: "/courses"
      }, { status: 404 });
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: { 
        userId: user.id, 
        courseId: params.id 
      }
    });

    if (!enrollment) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: "Not enrolled in this course",
        redirectTo: "/courses"
      }, { status: 403 });
    }

    // Check if enrollment has expired
    if (enrollment.expiresAt && enrollment.expiresAt < new Date()) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: "Course access has expired",
        redirectTo: "/courses",
        expiresAt: enrollment.expiresAt
      }, { status: 403 });
    }

    // Check subscription status
    const subscription = await prisma.subscription.findFirst({
      where: { 
        userId: user.id, 
        courseId: params.id,
        paid: true
      }
    });

    if (subscription && subscription.expiresAt && subscription.expiresAt < new Date()) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: "Subscription has expired",
        redirectTo: "/courses",
        expiresAt: subscription.expiresAt
      }, { status: 403 });
    }

    return NextResponse.json({ 
      hasAccess: true,
      enrollmentExpiresAt: enrollment.expiresAt,
      subscriptionExpiresAt: subscription?.expiresAt
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