import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface StoryPayload {
  storyId?: string;
  name?: string;
  role?: string;
  content?: string;
  image?: string;
  rating?: number;
}

async function getCurrentDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return { error: "Unauthorized", status: 401 as const };

  const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
  if (!primaryEmail) {
    return { error: "No email found for current user.", status: 400 as const };
  }

  let user = await prisma.user.findUnique({
    where: { clerkUserId: clerkUser.id },
    select: { id: true, clerkUserId: true, email: true, name: true },
  });

  if (!user) {
    const byEmail = await prisma.user.findUnique({
      where: { email: primaryEmail },
      select: { id: true, clerkUserId: true, email: true, name: true },
    });

    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: { clerkUserId: clerkUser.id },
        select: { id: true, clerkUserId: true, email: true, name: true },
      });
    } else {
      user = await prisma.user.create({
        data: {
          clerkUserId: clerkUser.id,
          email: primaryEmail,
          name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null,
        },
        select: { id: true, clerkUserId: true, email: true, name: true },
      });
    }
  }

  return { user };
}

function validatePayload(payload: StoryPayload) {
  if (!payload.name?.trim()) return "Name is required.";
  if (!payload.role?.trim()) return "Role/Achievement is required.";
  if (!payload.content?.trim()) return "Success message is required.";
  if (!payload.image?.trim()) return "Profile photo is required.";

  const rating = Number(payload.rating ?? 0);
  if (Number.isNaN(rating) || rating < 1 || rating > 5) {
    return "Rating must be between 1 and 5.";
  }

  return null;
}

const applicationSelect = {
  id: true,
  userId: true,
  name: true,
  role: true,
  content: true,
  image: true,
  rating: true,
  submittedViaForm: true,
  approvalStatus: true,
  isApproved: true,
  approvalNotes: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
};

// GET /api/success-story-application — fetch current user's story application
export async function GET() {
  try {
    const resolved = await getCurrentDbUser();
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const story = await prisma.studentSuccessStory.findFirst({
      where: { userId: resolved.user.id },
      orderBy: { updatedAt: "desc" },
      select: applicationSelect,
    });

    return NextResponse.json({
      exists: Boolean(story),
      story: story ?? null,
    });
  } catch (error) {
    console.error("❌ GET /api/success-story-application:", error);
    return NextResponse.json({ error: "Failed to fetch story application." }, { status: 500 });
  }
}

// POST /api/success-story-application — create student's story application
export async function POST(req: NextRequest) {
  try {
    const resolved = await getCurrentDbUser();
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const body: StoryPayload = await req.json();
    const validationError = validatePayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const existing = await prisma.studentSuccessStory.findFirst({
      where: { userId: resolved.user.id },
      select: { id: true },
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "You have already shared a success story. Please edit your existing submission.",
          code: "STORY_ALREADY_EXISTS",
        },
        { status: 409 }
      );
    }

    const story = await prisma.studentSuccessStory.create({
      data: {
        userId: resolved.user.id,
        name: body.name!.trim(),
        role: body.role!.trim(),
        content: body.content!.trim(),
        image: body.image!.trim(),
        rating: Number(body.rating),
        submittedViaForm: true,
        approvalStatus: "pending",
        isApproved: false,
        approvedAt: null,
        approvalNotes: null,
      },
      select: applicationSelect,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your story has been submitted for admin review.",
        story,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ POST /api/success-story-application:", error);
    return NextResponse.json({ error: "Failed to submit story." }, { status: 500 });
  }
}

// PUT /api/success-story-application — update and re-submit for approval
export async function PUT(req: NextRequest) {
  try {
    const resolved = await getCurrentDbUser();
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const body: StoryPayload = await req.json();
    const validationError = validatePayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const existing = body.storyId
      ? await prisma.studentSuccessStory.findUnique({ where: { id: body.storyId } })
      : await prisma.studentSuccessStory.findFirst({
          where: { userId: resolved.user.id },
          orderBy: { updatedAt: "desc" },
        });

    if (!existing) {
      return NextResponse.json({ error: "No success story found for your account." }, { status: 404 });
    }

    if (existing.userId !== resolved.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.studentSuccessStory.update({
      where: { id: existing.id },
      data: {
        name: body.name!.trim(),
        role: body.role!.trim(),
        content: body.content!.trim(),
        image: body.image!.trim(),
        rating: Number(body.rating),
        submittedViaForm: true,
        approvalStatus: "pending",
        isApproved: false,
        approvedAt: null,
        approvalNotes: null,
      },
      select: applicationSelect,
    });

    return NextResponse.json({
      success: true,
      message: "Your updated story has been re-submitted for admin approval.",
      story: updated,
    });
  } catch (error) {
    console.error("❌ PUT /api/success-story-application:", error);
    return NextResponse.json({ error: "Failed to update story." }, { status: 500 });
  }
}
