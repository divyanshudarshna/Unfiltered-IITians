import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// import { currentUser } from "@clerk/nextjs/server";

// async function adminAuth() {
//   const clerkUser = await currentUser();

//   if (!clerkUser || clerkUser.publicMetadata.role !== "ADMIN") {
//     throw new Error("Unauthorized");
//   }

//   return clerkUser;
// }

export async function GET(req: Request) {
  try {
    // await adminAuth();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: { include: { course: true } },
        mockAttempts: { include: { mockTest: true } },
        subscriptions: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}



export async function PUT(req: Request, { params }: { params: { userId: string } }) {
  try {
    // await adminAuth();

    const userId = params.userId;
    const data = await req.json();

    // Only allow updating specific fields:
    const updateData: any = {};

    if (data.role) updateData.role = data.role;
    if (typeof data.isSubscribed === "boolean") updateData.isSubscribed = data.isSubscribed;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.dob !== undefined) updateData.dob = data.dob ? new Date(data.dob) : null;
    if (data.fieldOfStudy !== undefined) updateData.fieldOfStudy = data.fieldOfStudy;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}


export async function DELETE(req: Request, { params }: { params: { userId: string } }) {
  try {
    // await adminAuth();

    const userId = params.userId;

    // Optional: You may want to delete related records (mockAttempts, subscriptions) first
    await prisma.mockAttempt.deleteMany({ where: { userId } });
    await prisma.subscription.deleteMany({ where: { userId } });
    await prisma.enrollment.deleteMany({ where: { userId } });

    // Delete user
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ message: "User deleted" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
