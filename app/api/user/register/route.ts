// app/api/user/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server"; // 👈 Import Clerk server-side API
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clerkUserId, email, name, phoneNumber, dob, fieldOfStudy, profileImageUrl } = body;

    // console.log("📦 Registering user:", { clerkUserId, email, name });

    if (!clerkUserId || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (existingUser) {
      // console.log("✅ User already exists:", existingUser.email);
      return NextResponse.json({ user: existingUser, created: false });
    }

    // 🔹 Use profileImageUrl from request body first, then fallback to Clerk user
    const clerkUser = await currentUser();
    const finalProfileImageUrl = profileImageUrl || clerkUser?.imageUrl || null;

    // Create user with Clerk's image as default
  const newUser = await prisma.user.upsert({
  where: { email: normalizedEmail },
  update: {
    clerkUserId,
    name: name?.trim() || null,
    phoneNumber,
    dob: dob ? new Date(dob) : undefined,
    fieldOfStudy,
    profileImageUrl: finalProfileImageUrl,
  },
  create: {
    clerkUserId,
    email: normalizedEmail,
    name: name?.trim() || null,
    role: "STUDENT",
    profileImageUrl: finalProfileImageUrl,
    phoneNumber,
    dob: dob ? new Date(dob) : undefined,
    fieldOfStudy,
  },
});


    // console.log("✅ User created and stored:", newUser.email);
    
    // Send welcome email asynchronously (don't wait for it to complete)
    if (newUser) {
      sendEmail({
        to: newUser.email,
        template: 'welcome',
        data: {
          userName: newUser.name || 'Student',
        },
      }).catch((err) => {
        console.error('❌ Failed to send welcome email:', err);
        // Don't throw error - registration should succeed even if email fails
      });
    }
    
    return NextResponse.json({ user: newUser, created: true });
  } catch (error: unknown) {
    // console.error("❌ Error creating user:", error);

    if (error && typeof error === 'object' && 'code' in error && error.code === "P2002") {
      return NextResponse.json({ error: "Duplicate user" }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
