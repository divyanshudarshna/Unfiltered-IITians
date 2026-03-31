// app/api/certificates/generate/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";

// Generate unique certificate ID
function generateCertificateId(): string {
  const prefix = "UNF";
  const year = new Date().getFullYear();
  const uniqueId = nanoid(8).toUpperCase();
  return `${prefix}-${year}-${uniqueId}`;
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId } = body;

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

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        contents: {
          include: {
            lectures: true,
            quiz: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if course is a SKILLS course
    if (course.courseType !== "SKILLS") {
      return NextResponse.json(
        { error: "Certificates are only available for Skills courses" },
        { status: 400 }
      );
    }

    // Check enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: dbUser.id,
        courseId: courseId,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "You are not enrolled in this course" },
        { status: 403 }
      );
    }

    // Calculate progress - matching frontend logic
    const courseProgress = await prisma.courseProgress.findMany({
      where: {
        userId: dbUser.id,
        courseId: courseId,
      },
    });

    console.log(`[Certificate] Found ${courseProgress.length} progress records for user ${dbUser.id}, course ${courseId}`);
    console.log(`[Certificate] Progress records:`, JSON.stringify(courseProgress, null, 2));

    // Create a map of contentId -> progress for quick lookup
    const progressMap = new Map<string, { completed: boolean; quizScore: number | null }>();
    for (const progress of courseProgress) {
      progressMap.set(progress.contentId, {
        completed: progress.completed,
        quizScore: progress.quizScore,
      });
    }

    // Count total items (lectures + quizzes) - same as frontend CourseSidebar
    let totalItems = 0;
    let completedItems = 0;

    console.log(`[Certificate] Course has ${course.contents.length} content modules`);

    for (const content of course.contents) {
      const contentProgress = progressMap.get(content.id);
      
      console.log(`[Certificate] Content "${content.title}" (${content.id}): ${content.lectures.length} lectures, hasQuiz: ${!!content.quiz}, progress: ${JSON.stringify(contentProgress)}`);
      
      // Count lectures
      for (const lecture of content.lectures) {
        totalItems++;
        // A lecture is completed if the content has a completed progress record
        if (contentProgress?.completed) {
          completedItems++;
        }
      }
      
      // Count quiz if exists
      if (content.quiz) {
        totalItems++;
        // Quiz is completed if there's a quizScore in progress
        if (contentProgress?.quizScore !== null && contentProgress?.quizScore !== undefined) {
          completedItems++;
        }
      }
    }

    const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    
    console.log(`[Certificate] Progress calculation: ${completedItems}/${totalItems} = ${progressPercentage}%`);

    // Check if course is 100% completed
    if (progressPercentage < 100) {
      return NextResponse.json(
        { 
          error: "Course must be 100% completed to receive a certificate",
          progress: Math.round(progressPercentage),
        },
        { status: 400 }
      );
    }

    // Check if certificate already exists
    const existingCertificate = await prisma.certificate.findUnique({
      where: {
        userId_courseId: {
          userId: dbUser.id,
          courseId: courseId,
        },
      },
    });

    if (existingCertificate) {
      return NextResponse.json({
        success: true,
        certificate: existingCertificate,
        message: "Certificate already exists",
      });
    }

    // Generate new certificate
    const certificateId = generateCertificateId();
    const studentName = dbUser.name || user.firstName + " " + (user.lastName || "");

    const certificate = await prisma.certificate.create({
      data: {
        userId: dbUser.id,
        courseId: courseId,
        certificateId: certificateId,
        studentName: studentName,
        courseName: course.title,
        completionDate: new Date(),
        issuedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        completionDate: certificate.completionDate.toISOString(),
        issuedAt: certificate.issuedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Certificate generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate certificate" },
      { status: 500 }
    );
  }
}
