// app/api/certificates/email/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { certificateId, courseId } = body;

    if (!certificateId || !courseId) {
      return NextResponse.json(
        { error: "Certificate ID and Course ID are required" },
        { status: 400 }
      );
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get certificate
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        course: true,
        user: true,
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // Verify ownership
    if (certificate.userId !== dbUser.id) {
      return NextResponse.json(
        { error: "You don't have permission to access this certificate" },
        { status: 403 }
      );
    }

    if (courseId && certificate.courseId !== courseId) {
      return NextResponse.json(
        { error: "Certificate does not belong to the selected course" },
        { status: 400 }
      );
    }

    // Send a lightweight certificate email (no PDF attachment).
    // This avoids heavy server-side PDF generation latency and improves reliability.
    const emailResult = await sendEmail({
      to: dbUser.email,
      template: "certificate",
      data: {
        userName: certificate.studentName,
        courseName: certificate.courseName,
        additionalInfo: certificate.certificateId,
      },
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || "Failed to send email");
    }

    // Update certificate with email sent timestamp
    await prisma.certificate.update({
      where: { id: certificateId },
      data: { emailSentAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Certificate email sent successfully",
    });
  } catch (error: any) {
    console.error("Certificate email error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send certificate email" },
      { status: 500 }
    );
  }
}
