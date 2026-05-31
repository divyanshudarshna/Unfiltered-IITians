import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

export async function GET(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    const instructorUnreadStatuses = ["pending", "rejected"];
    const successStoryUnreadStatuses = ["pending", "rejected"];

    // Fetch pending contact messages
    const contactMessages = await prisma.contactUs.findMany({
      where: {
        status: "PENDING"
      },
      select: {
        id: true,
        name: true,
        subject: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    });

    // Fetch unread feedbacks (PENDING status with no replies)
    const feedbacks = await prisma.courseFeedback.findMany({
      where: {
        status: "PENDING",
        replies: {
          none: {}
        }
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        },
        course: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    });

    // Fetch unapproved/rejected instructor applications submitted via form
    const instructorApplications = await prisma.instructor.findMany({
      where: {
        submittedViaForm: true,
        approvalStatus: {
          in: instructorUnreadStatuses,
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        approvalStatus: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    });

    // Fetch success-story submissions pending attention
    const successStoryApplications = await prisma.studentSuccessStory.findMany({
      where: {
        submittedViaForm: true,
        approvalStatus: {
          in: successStoryUnreadStatuses,
        },
      },
      select: {
        id: true,
        name: true,
        role: true,
        approvalStatus: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    });

    // Exact unread counters for bell/sidebar badges
    const [contactCount, feedbackCount, instructorCount, successStoryCount] = await Promise.all([
      prisma.contactUs.count({
        where: {
          status: "PENDING",
        },
      }),
      prisma.courseFeedback.count({
        where: {
          status: "PENDING",
          replies: {
            none: {},
          },
        },
      }),
      prisma.instructor.count({
        where: {
          submittedViaForm: true,
          approvalStatus: {
            in: instructorUnreadStatuses,
          },
        },
      }),
      prisma.studentSuccessStory.count({
        where: {
          submittedViaForm: true,
          approvalStatus: {
            in: successStoryUnreadStatuses,
          },
        },
      }),
    ]);

    // Combine and format notifications
    const notifications = [
      ...contactMessages.map(msg => ({
        id: `contact-${msg.id}`,
        type: "contact" as const,
        title: `New contact from ${msg.name}`,
        message: msg.subject,
        createdAt: msg.createdAt,
        link: "/admin/contact-us"
      })),
      ...feedbacks.map(fb => ({
        id: `feedback-${fb.id}`,
        type: "feedback" as const,
        title: `Feedback from ${fb.user.name || fb.user.email}`,
        message: `${fb.course.title}: ${fb.content.substring(0, 50)}...`,
        createdAt: fb.createdAt,
        link: "/admin/feedbacks"
      })),
      ...instructorApplications.map((application) => ({
        id: `instructor-${application.id}`,
        type: "instructor" as const,
        title:
          application.approvalStatus === "rejected"
            ? `Rejected instructor application: ${application.fullName}`
            : `New instructor application: ${application.fullName}`,
        message:
          application.approvalStatus === "rejected"
            ? `Needs follow-up. Latest status is rejected (${application.email}).`
            : `Pending review for ${application.email}.`,
        createdAt: application.updatedAt,
        link: "/admin/instructors?filter=attention",
      })),
      ...successStoryApplications.map((story) => ({
        id: `success-story-${story.id}`,
        type: "success_story" as const,
        title:
          story.approvalStatus === "rejected"
            ? `Rejected success story: ${story.name}`
            : `New success story: ${story.name}`,
        message:
          story.approvalStatus === "rejected"
            ? `Needs follow-up. Latest status is rejected (${story.role}).`
            : `Pending review: ${story.role}`,
        createdAt: story.updatedAt,
        link: "/admin/successStories?filter=attention",
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalCount = contactCount + feedbackCount + instructorCount + successStoryCount;

    return NextResponse.json({ 
      notifications,
      totalCount,
      contactCount,
      feedbackCount,
      instructorCount,
      successStoryCount,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
