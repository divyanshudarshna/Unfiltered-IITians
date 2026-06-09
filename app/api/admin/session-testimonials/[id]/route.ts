import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import {
  clampGuidanceTestimonialRating,
  getYoutubeVideoId,
  normalizeGuidanceTestimonialStatus,
  normalizeGuidanceTestimonialType,
} from "@/lib/guidance-testimonials";

async function requireAdmin(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { error: null };
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error) return admin.error;

    const { id } = await context.params;
    const body = await req.json();
    const sessionId = String(body.sessionId || "").trim();
    const type = normalizeGuidanceTestimonialType(body.type);
    const status = normalizeGuidanceTestimonialStatus(body.status);

    if (!sessionId) {
      return NextResponse.json({ error: "Session is required" }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, title: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (type === "YOUTUBE") {
      const youtubeUrl = String(body.youtubeUrl || "").trim();
      const youtubeVideoId = getYoutubeVideoId(youtubeUrl);

      if (!youtubeVideoId) {
        return NextResponse.json({ error: "Valid YouTube link is required" }, { status: 400 });
      }

      const testimonial = await prisma.guidanceSessionTestimonial.update({
        where: { id },
        data: {
          session: { connect: { id: session.id } },
          type,
          status,
          youtubeUrl,
          youtubeVideoId,
          name: null,
          sessionAttended: null,
          description: null,
          rating: 5,
        },
        include: { session: { select: { id: true, title: true, status: true, expiryDate: true } } },
      });

      return NextResponse.json(testimonial);
    }

    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const sessionAttended = String(body.sessionAttended || session.title).trim();

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
    }

    const testimonial = await prisma.guidanceSessionTestimonial.update({
      where: { id },
      data: {
        session: { connect: { id: session.id } },
        type,
        status,
        youtubeUrl: null,
        youtubeVideoId: null,
        name,
        sessionAttended,
        description,
        rating: clampGuidanceTestimonialRating(body.rating),
      },
      include: { session: { select: { id: true, title: true, status: true, expiryDate: true } } },
    });

    return NextResponse.json(testimonial);
  } catch (error) {
    console.error("Error updating session testimonial:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error) return admin.error;

    const { id } = await context.params;

    await prisma.guidanceSessionTestimonial.delete({ where: { id } });

    return NextResponse.json({ message: "Session testimonial deleted successfully" });
  } catch (error) {
    console.error("Error deleting session testimonial:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
