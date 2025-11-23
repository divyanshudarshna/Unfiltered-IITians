import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function GET(req: Request) {
  try {
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
        subscriptions: {
          include: {
            course: true,
            mockTest: true,
            mockBundle: true
          }
        },
        courseProgress: { include: { course: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the current user is an admin
    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { role } = await request.json()
    
    if (!role || !["STUDENT", "INSTRUCTOR", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Get user's Clerk ID
    const userToUpdate = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { clerkUserId: true }
    })

    if (!userToUpdate) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update role in database
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    })

    // ✅ Sync role with Clerk public metadata
    try {
      const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userToUpdate.clerkUserId}/metadata`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_metadata: {
            role: role
          }
        })
      })

      if (!clerkResponse.ok) {
        console.error('Failed to sync role with Clerk:', await clerkResponse.text())
        // Don't fail the request, but log the error
      } else {
        console.log(`✅ Successfully synced role ${role} to Clerk for user ${updatedUser.email}`)
      }
    } catch (clerkError) {
      console.error('Error syncing with Clerk:', clerkError)
      // Don't fail the request
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request, { params }: { params: { userId: string } }) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the current user is an admin
    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const userId = params.userId;
    const data = await req.json();

    // Only allow updating specific fields:
    const updateData: {
      role?: "STUDENT" | "INSTRUCTOR" | "ADMIN";
      isSubscribed?: boolean;
      name?: string;
      phoneNumber?: string;
      dob?: Date | null;
      fieldOfStudy?: string;
    } = {};

    if (data.role && ["STUDENT", "INSTRUCTOR", "ADMIN"].includes(data.role)) {
      updateData.role = data.role as "STUDENT" | "INSTRUCTOR" | "ADMIN";
    }
    if (typeof data.isSubscribed === "boolean") updateData.isSubscribed = data.isSubscribed;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.dob !== undefined) updateData.dob = data.dob ? new Date(data.dob) : null;
    if (data.fieldOfStudy !== undefined) updateData.fieldOfStudy = data.fieldOfStudy;

    // Get user's Clerk ID before update
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
      select: { clerkUserId: true }
    })

    if (!userToUpdate) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // ✅ If role was updated, sync with Clerk
    if (updateData.role) {
      try {
        const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userToUpdate.clerkUserId}/metadata`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_metadata: {
              role: updateData.role
            }
          })
        })

        if (!clerkResponse.ok) {
          console.error('Failed to sync role with Clerk:', await clerkResponse.text())
        } else {
          console.log(`✅ Successfully synced role ${updateData.role} to Clerk for user ${updatedUser.email}`)
        }
      } catch (clerkError) {
        console.error('Error syncing with Clerk:', clerkError)
      }
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { userId: string } }) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the current user is an admin
    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const userId = params.userId;

    // Delete all related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete user's mock attempts
      await tx.mockAttempt.deleteMany({ where: { userId } });
      
      // Delete user's subscriptions
      await tx.subscription.deleteMany({ where: { userId } });
      
      // Delete user's enrollments
      await tx.enrollment.deleteMany({ where: { userId } });
      
      // Delete user's course progress
      await tx.courseProgress.deleteMany({ where: { userId } });
      
      // Delete user's session enrollments
      await tx.sessionEnrollment.deleteMany({ where: { userId } });
      
      // Delete user's feedbacks
      await tx.courseFeedback.deleteMany({ where: { userId } });
      
      // Delete user's feedback replies (when user is admin)
      await tx.feedbackReply.deleteMany({ where: { adminId: userId } });
      
      // Delete announcement recipients
      await tx.announcementRecipient.deleteMany({ where: { userId } });
      
      // Delete feedback reply recipients
      await tx.feedbackReplyRecipient.deleteMany({ where: { userId } });
      
      // Finally, delete the user
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
