import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/instructor-application — public, no auth required
// Accepts instructor application from the public /instructor-form page.
// Duplicate prevention: checks email uniqueness before creating.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      title,
      bio,
      profileImageUrl,
      academicAffiliations,
      researchAppointments,
      expertiseAreas,
      awards,
      socialLinks,
    } = body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!fullName?.trim()) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // ── Duplicate prevention: check by email ─────────────────────────────────
    const existing = await prisma.instructor.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, approvalStatus: true },
    });

    if (existing) {
      if (existing.approvalStatus === "approved") {
        return NextResponse.json(
          { error: "An instructor with this email is already approved on the platform." },
          { status: 409 }
        );
      }
      // Already submitted (pending or rejected)
      return NextResponse.json(
        {
          error:
            "An application with this email already exists. Our team will review it shortly. Please check your inbox for updates.",
          code: "DUPLICATE_APPLICATION",
        },
        { status: 409 }
      );
    }

    // ── Create instructor record (pending approval) ──────────────────────────
    const instructor = await prisma.instructor.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        title: title?.trim() || null,
        bio: bio?.trim() || null,
        profileImageUrl: profileImageUrl?.trim() || null,
        academicAffiliations: academicAffiliations ?? [],
        researchAppointments: researchAppointments ?? [],
        expertiseAreas: expertiseAreas ?? [],
        awards: awards?.trim() || null,
        socialLinks: socialLinks ?? null,
        isActive: false,         // inactive until admin approves
        isApproved: false,
        approvalStatus: "pending",
        submittedViaForm: true,
        order: 0,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Your application has been submitted successfully! Our team will review your profile and get back to you via email.",
        id: instructor.id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ POST /api/instructor-application:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
