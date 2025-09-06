import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

// ================== GET ==================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const courseId = searchParams.get("courseId");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (courseId) where.courseId = courseId;

    const [announcements, total] = await Promise.all([
      prisma.courseAnnouncement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          course: { select: { id: true, title: true } },
          recipients: { select: { read: true, deliveredEmail: true } },
        },
        skip,
        take: limit,
      }),
      prisma.courseAnnouncement.count({ where }),
    ]);

    const formatted = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      course: a.course,
      sendEmail: a.sendEmail,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      totalRecipients: a.recipients.length,
      readCount: a.recipients.filter((r) => r.read).length,
      emailDeliveredCount: a.recipients.filter((r) => r.deliveredEmail).length,
    }));

    return NextResponse.json({
      announcements: formatted,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Error fetching announcements:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ================== POST ==================
export async function POST(req: NextRequest) {
  try {
    const { courseId, title, message, sendEmail = false } = await req.json();

    if (!courseId || !title || !message) {
      return NextResponse.json({ error: "courseId, title, message required" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // Create announcement
    const announcement = await prisma.courseAnnouncement.create({
      data: { courseId, title, message, sendEmail },
    });

    // Enrolled users
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      select: { user: { select: { id: true, email: true, name: true } } },
    });

    // Create recipients
    let recipientsCreated = 0;
    if (enrollments.length > 0) {
      const result = await prisma.announcementRecipient.createMany({
        data: enrollments.map((e) => ({
          announcementId: announcement.id,
          userId: e.user.id,
        })),
      
      });
      recipientsCreated = result.count;
    }

    // Send email
    let emailsSent = 0;
    if (sendEmail && enrollments.length > 0) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      for (const e of enrollments) {
        if (e.user.email) {
          try {
            await transporter.sendMail({
              from: `"Course Announcements" <${process.env.SMTP_FROM}>`,
              to: e.user.email,
              subject: `[${course.title}] ${title}`,
              html: `<h2>${title}</h2><p>${message}</p>`,
            });
            emailsSent++;
          } catch (error) {
            console.error("Failed to send email:", error);
          }
        }
      }
    }

    return NextResponse.json({ success: true, announcement, recipientsCreated, emailsSent });
  } catch (err) {
    console.error("Error creating announcement:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ================== PUT ==================
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });

    const body = await req.json();
    const announcement = await prisma.courseAnnouncement.update({
      where: { id },
      data: body,
      include: { course: { select: { title: true } } },
    });

    return NextResponse.json({ success: true, announcement });
  } catch (err) {
    console.error("Error updating announcement:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ================== DELETE ==================
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });

    await prisma.announcementRecipient.deleteMany({ where: { announcementId: id } });

    const announcement = await prisma.courseAnnouncement.delete({
      where: { id },
      include: { course: { select: { title: true } } },
    });

    return NextResponse.json({ success: true, message: `Announcement "${announcement.title}" deleted` });
  } catch (err) {
    console.error("Error deleting announcement:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
