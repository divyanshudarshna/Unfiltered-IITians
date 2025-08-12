import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImageUrl: true,
        phoneNumber: true,
        fieldOfStudy: true,
        isSubscribed: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      profileImageUrl: u.profileImageUrl,
      phoneNumber: u.phoneNumber,
      fieldOfStudy: u.fieldOfStudy,
      isSubscribed: u.isSubscribed,
      joinedAt: u.createdAt.toISOString().split("T")[0], // short date format YYYY-MM-DD
    }));

    return NextResponse.json(formattedUsers);
  } catch (error: any) {
    console.error("Error in admin GET users:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
