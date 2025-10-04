import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }
    const users = await prisma.user.findMany({
      include: {
        subscriptions: {
          select: {
            id: true,
            paid: true,
            mockTest: {
              select: {
                price: true,
                actualPrice: true,
              }
            },
            course: {
              select: {
                price: true,
                actualPrice: true,
              }
            }
          }
        },
        enrollments: {
          select: {
            id: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedUsers = users.map((u) => {
      // Calculate actual revenue from paid subscriptions
      const totalRevenue = u.subscriptions.reduce((sum: number, sub) => {
        if (!sub.paid) return sum;
        
        // Get the actual price paid (actualPrice if exists, otherwise price)
        let itemPrice = 0;
        if (sub.mockTest) {
          itemPrice = sub.mockTest.actualPrice || sub.mockTest.price;
        } else if (sub.course) {
          itemPrice = sub.course.actualPrice || sub.course.price;
        }
        
        return sum + itemPrice;
      }, 0);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        profileImageUrl: u.profileImageUrl,
        phoneNumber: u.phoneNumber,
        fieldOfStudy: u.fieldOfStudy,
        isSubscribed: u.isSubscribed,
        createdAt: u.createdAt.toISOString(),
        joinedAt: u.createdAt.toISOString().split("T")[0],
        subscriptionsCount: u.subscriptions.length,
        enrollmentsCount: u.enrollments.length,
        totalRevenue: totalRevenue,
      };
    });

    return NextResponse.json(formattedUsers);
  } catch (error: unknown) {
    console.error("Error in admin GET users:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
