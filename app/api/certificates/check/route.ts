// app/api/certificates/check/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for existing certificate
    const certificate = await prisma.certificate.findUnique({
      where: {
        userId_courseId: {
          userId: dbUser.id,
          courseId: courseId,
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({ certificate: null });
    }

    return NextResponse.json({
      certificate: {
        id: certificate.id,
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        completionDate: certificate.completionDate.toISOString(),
        issuedAt: certificate.issuedAt.toISOString(),
        emailSentAt: certificate.emailSentAt?.toISOString() || null,
      },
    });
  } catch (error: any) {
    console.error("Certificate check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check certificate" },
      { status: 500 }
    );
  }
}
