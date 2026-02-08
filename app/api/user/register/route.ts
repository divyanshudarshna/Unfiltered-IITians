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

    // Check if user already exists by clerkUserId
    let existingUser = await prisma.user.findUnique({
      where: { clerkUserId },
    });

    // If not found by clerkUserId, check by email (handles Clerk ID migration)
    if (!existingUser) {
      existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      // If found by email with different clerkUserId, migrate to new Clerk ID
      if (existingUser && existingUser.clerkUserId !== clerkUserId) {
        console.log(`🔄 Migrating user ${existingUser.email} from Clerk ID ${existingUser.clerkUserId} to ${clerkUserId}`);
        existingUser = await prisma.user.update({
          where: { email: normalizedEmail },
          data: { clerkUserId },
        });
      }
    }

    // If user exists, just update their info and DON'T send welcome email
    if (existingUser) {
      // console.log("✅ User already exists, updating info:", existingUser.email);
      
      // 🔹 Use profileImageUrl from request body first, then fallback to Clerk user
      const clerkUser = await currentUser();
      const finalProfileImageUrl = profileImageUrl || clerkUser?.imageUrl || existingUser.profileImageUrl;

      const updatedUser = await prisma.user.update({
        where: { clerkUserId },
        data: {
          name: name?.trim() || existingUser.name,
          phoneNumber: phoneNumber || existingUser.phoneNumber,
          dob: dob ? new Date(dob) : existingUser.dob,
          fieldOfStudy: fieldOfStudy || existingUser.fieldOfStudy,
          profileImageUrl: finalProfileImageUrl,
        },
      });

      return NextResponse.json({ user: updatedUser, created: false });
    }

    // 🔹 User doesn't exist - CREATE NEW USER
    // 🔹 Use profileImageUrl from request body first, then fallback to Clerk user
    const clerkUser = await currentUser();
    const finalProfileImageUrl = profileImageUrl || clerkUser?.imageUrl || null;

    const newUser = await prisma.user.create({
      data: {
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
    
    // ✅ Send welcome email ONLY for newly created users (not for updates)
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
