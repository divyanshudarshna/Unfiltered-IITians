import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as Email from '@/lib/email';
import { assertAdminApiAccess } from "@/lib/roleAuth";

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ================== GET ==================
export async function GET(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, req.method);
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
    await assertAdminApiAccess(req.url, req.method);
  const { courseId, title, message, sendEmail: sendAsEmail = false } = await req.json();

    if (!courseId || !title || !message) {
      return NextResponse.json({ error: "courseId, title, message required" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // Create announcement
    const announcement = await prisma.courseAnnouncement.create({
      data: { courseId, title, message, sendEmail: sendAsEmail },
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

    // Send email via central email service (lib/email.ts)
    let emailsSent = 0;
    let emailErrors = 0;
    if (sendAsEmail && enrollments.length > 0) {
      // Verify email config quickly
  const verifyResult = await Email.verifyEmailConfig();
  console.log('verifyEmailConfig result:', verifyResult);
      if (!verifyResult.success) {
        console.warn('Email configuration invalid, skipping email sending', verifyResult.error);
      } else {
        for (const e of enrollments) {
          const recipientEmail = e.user.email;
          if (recipientEmail && isValidEmail(recipientEmail)) {
              try {
              const result = await Email.sendEmail({
                to: recipientEmail,
                template: undefined,
                customSubject: `[${course.title}] ${title}`,
                customHtml: `<h2>${title}</h2><p>${message}</p>`,
              });

              console.log(`sendEmail result for ${recipientEmail}:`, result);
              if (result.success) {
                emailsSent++;
                await prisma.announcementRecipient.updateMany({
                  where: { announcementId: announcement.id, userId: e.user.id },
                  data: { deliveredEmail: true },
                });
              } else {
                emailErrors++;
                console.error(`Failed to send via sendEmail to ${recipientEmail}:`, result.error);
              }

              // small delay to be polite to SMTP providers
              await new Promise((r) => setTimeout(r, 80));
            } catch (err) {
              emailErrors++;
              console.error(`Unexpected error sending email to ${recipientEmail}:`, err);
            }
          }
        }
      }
    }

    // Log batch email to database
    if (emailsSent > 0) {
      try {
        const successfulRecipients = await prisma.announcementRecipient.findMany({
          where: { 
            announcementId: announcement.id,
            deliveredEmail: true
          },
          include: {
            user: {
              select: { email: true }
            }
          }
        });
        
        const successfulEmails = successfulRecipients.map(r => r.user.email);
        
        await prisma.emailLog.create({
          data: {
            subject: `[${course.title}] ${title}`,
            body: message,
            recipients: successfulEmails,
            recipientCount: emailsSent,
            sentBy: 'Admin',
            source: 'course-announcement',
            metadata: {
              courseId,
              announcementId: announcement.id,
              totalRecipients: enrollments.length,
              emailsSent,
              emailErrors
            }
          }
        });
        console.log('📧 Course announcement email batch logged to database');
      } catch (logError) {
        console.error('Failed to log course announcement email batch:', logError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      announcement, 
      recipientsCreated, 
      emailsSent,
      emailErrors: emailErrors > 0 ? emailErrors : undefined
    });
  } catch (err) {
    console.error("Error creating announcement:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ================== PUT ==================
export async function PUT(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });

    const body = await req.json();
    console.log('PUT /api/admin/course-announcement body:', body);

    // Sanitize update payload to avoid passing unexpected fields to Prisma
    const updateData: any = {};
    if (typeof body.title === 'string') updateData.title = body.title;
    if (typeof body.message === 'string') updateData.message = body.message;
    if (body.hasOwnProperty('sendEmail')) updateData.sendEmail = Boolean(body.sendEmail);

    let announcement;
    try {
      console.log('Updating announcement id:', id, 'with data:', updateData);
      announcement = await prisma.courseAnnouncement.update({
        where: { id },
        data: updateData,
        include: { course: { select: { title: true } } },
      });
      console.log('Announcement updated:', { id: announcement.id, title: announcement.title });
    } catch (prismaErr) {
      console.error('Prisma error updating announcement:', prismaErr);
      // Re-throw so outer catch returns 500 but we have detailed logs
      throw prismaErr;
    }

    // If sendEmail flag is set on update, attempt to send emails to enrolled users
    let emailsSent = 0;
    let emailErrors = 0;
    if (body.sendEmail) {
      const courseId = announcement.courseId;
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId },
        select: { user: { select: { id: true, email: true, name: true } } },
      });

      if (enrollments.length > 0) {
        // Ensure recipients exist - use createMany but fall back if skipDuplicates unsupported
        try {
          await prisma.announcementRecipient.createMany({
            data: enrollments.map((e) => ({ announcementId: announcement.id, userId: e.user.id })),
            skipDuplicates: true,
          });
        } catch (createManyErr) {
          console.warn('createMany with skipDuplicates failed, falling back to individual upserts:', createManyErr);
          for (const e of enrollments) {
            try {
              await prisma.announcementRecipient.upsert({
                where: { announcementId_userId: { announcementId: announcement.id, userId: e.user.id } },
                update: {},
                create: { announcementId: announcement.id, userId: e.user.id },
              });
            } catch (upsertErr) {
              console.error('Failed to upsert announcementRecipient for user', e.user.id, upsertErr);
            }
          }
        }

        const verifyResult = await Email.verifyEmailConfig();
        if (!verifyResult.success) {
          console.warn('Email configuration invalid, skipping email sending on update', verifyResult.error);
        } else {
          for (const e of enrollments) {
            const recipientEmail = e.user.email;
            if (recipientEmail && isValidEmail(recipientEmail)) {
              try {
                const result = await Email.sendEmail({
                  to: recipientEmail,
                  customSubject: `[${announcement.course.title}] ${announcement.title}`,
                  customHtml: `<h2>${announcement.title}</h2><p>${announcement.message}</p>`,
                });

                if (result.success) {
                  emailsSent++;
                  await prisma.announcementRecipient.updateMany({
                    where: { announcementId: announcement.id, userId: e.user.id },
                    data: { deliveredEmail: true },
                  });
                } else {
                  emailErrors++;
                }

                await new Promise((r) => setTimeout(r, 80));
              } catch (err) {
                emailErrors++;
                console.error(`Error sending announcement email to ${recipientEmail}:`, err);
              }
            }
          }
        }
      }

      // Log batch email to database
      if (emailsSent > 0) {
        try {
          const successfulRecipients = await prisma.announcementRecipient.findMany({
            where: { 
              announcementId: announcement.id,
              deliveredEmail: true
            },
            include: {
              user: {
                select: { email: true }
              }
            }
          });
          
          const successfulEmails = successfulRecipients.map(r => r.user.email);
          
          await prisma.emailLog.create({
            data: {
              subject: `[${announcement.course.title}] ${announcement.title}`,
              body: announcement.message,
              recipients: successfulEmails,
              recipientCount: emailsSent,
              sentBy: 'Admin',
              source: 'course-announcement-update',
              metadata: {
                courseId: announcement.courseId,
                announcementId: announcement.id,
                totalRecipients: enrollments.length,
                emailsSent,
                emailErrors
              }
            }
          });
          console.log('📧 Course announcement update email batch logged to database');
        } catch (logError) {
          console.error('Failed to log course announcement update email batch:', logError);
        }
      }
    }

    return NextResponse.json({ success: true, announcement, emailsSent, emailErrors: emailErrors || undefined });
  } catch (err) {
    console.error("Error updating announcement:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ================== DELETE ==================
export async function DELETE(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, req.method);
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
