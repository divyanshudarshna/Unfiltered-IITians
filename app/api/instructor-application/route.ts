import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

interface InstructorApplicationPayload {
  fullName?: string;
  email?: string;
  title?: string;
  bio?: string;
  profileImageUrl?: string;
  academicAffiliations?: unknown[];
  researchAppointments?: unknown[];
  expertiseAreas?: string[];
  awards?: string;
  socialLinks?: Record<string, string> | null;
  applicationId?: string;
}

function getNormalizedUserEmails(user: Awaited<ReturnType<typeof currentUser>>) {
  return (user?.emailAddresses ?? [])
    .map((entry) => entry.emailAddress?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value));
}

function selectApplicationFields() {
  return {
    id: true,
    fullName: true,
    email: true,
    title: true,
    bio: true,
    profileImageUrl: true,
    academicAffiliations: true,
    researchAppointments: true,
    expertiseAreas: true,
    awards: true,
    socialLinks: true,
    approvalStatus: true,
    isApproved: true,
    isActive: true,
    approvalNotes: true,
    approvedAt: true,
    submittedViaForm: true,
    createdAt: true,
    updatedAt: true,
  };
}

// POST /api/instructor-application — public, no auth required
// Accepts instructor application from the public /instructor-form page.
// Duplicate prevention: checks email uniqueness before creating.
export async function POST(req: NextRequest) {
  try {
    const body: InstructorApplicationPayload = await req.json();
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

// GET /api/instructor-application — authenticated, fetch current user's own application
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmails = getNormalizedUserEmails(user);
    if (userEmails.length === 0) {
      return NextResponse.json({ error: "No email found for current user." }, { status: 400 });
    }

    const application = await prisma.instructor.findFirst({
      where: { email: { in: userEmails } },
      orderBy: { updatedAt: "desc" },
      select: selectApplicationFields(),
    });

    return NextResponse.json({
      exists: Boolean(application),
      application: application ?? null,
    });
  } catch (err) {
    console.error("❌ GET /api/instructor-application:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

// PUT /api/instructor-application — authenticated update and re-submit for approval
export async function PUT(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmails = getNormalizedUserEmails(user);
    if (userEmails.length === 0) {
      return NextResponse.json({ error: "No email found for current user." }, { status: 400 });
    }

    const body: InstructorApplicationPayload = await req.json();
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
      applicationId,
    } = body;

    if (!fullName?.trim()) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (!userEmails.includes(normalizedEmail)) {
      return NextResponse.json(
        {
          error:
            "For security, application email must match one of your signed-in account emails.",
        },
        { status: 400 }
      );
    }

    const existing = applicationId
      ? await prisma.instructor.findUnique({ where: { id: applicationId } })
      : await prisma.instructor.findFirst({ where: { email: { in: userEmails } } });

    if (!existing) {
      return NextResponse.json(
        { error: "No instructor application found for your account." },
        { status: 404 }
      );
    }

    if (!existing.email || !userEmails.includes(existing.email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.instructor.update({
      where: { id: existing.id },
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        title: title?.trim() || null,
        bio: bio?.trim() || null,
        profileImageUrl: profileImageUrl?.trim() || null,
        academicAffiliations: academicAffiliations ?? [],
        researchAppointments: researchAppointments ?? [],
        expertiseAreas: expertiseAreas ?? [],
        awards: awards?.trim() || null,
        socialLinks: socialLinks ?? null,
        // Any applicant edit requires fresh admin review.
        isApproved: false,
        isActive: false,
        approvalStatus: "pending",
        approvedAt: null,
        approvalNotes: null,
        submittedViaForm: true,
      },
      select: selectApplicationFields(),
    });

    return NextResponse.json({
      success: true,
      message:
        "Your instructor profile has been updated and sent to admin for approval.",
      application: updated,
    });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return NextResponse.json(
        { error: "This email is already used by another instructor profile." },
        { status: 409 }
      );
    }

    console.error("❌ PUT /api/instructor-application:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
