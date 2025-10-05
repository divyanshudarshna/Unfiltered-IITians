// app/api/dashboard/active-items/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const clerkUserId = url.searchParams.get("userId");

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find Prisma user linked to Clerk
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      include: {
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                price: true,
                createdAt: true,
              }
            }
          }
        },
        subscriptions: {
          where: {
            paid: true, // Only paid subscriptions
          },
          include: {
            mockTest: {
              select: {
                id: true,
                title: true,
                description: true,
                price: true,
                createdAt: true,
              }
            },
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                price: true,
                createdAt: true,
              }
            },
            mockBundle: {
              select: {
                id: true,
                title: true,
                description: true,
                mockIds: true,
                basePrice: true,
                discountedPrice: true,
                createdAt: true,
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Process mock bundles and get mock details
    const mockBundlesWithDetails = await Promise.all(
      user.subscriptions
        .filter(sub => sub.mockBundle) // Filter subscriptions that have mockBundle
        .map(async (subscription) => {
          const bundle = subscription.mockBundle!;
          let mockTitles: string[] = [];
          
          if (bundle.mockIds && bundle.mockIds.length > 0) {
            const mocks = await prisma.mockTest.findMany({
              where: {
                id: { in: bundle.mockIds }
              },
              select: {
                title: true,
              }
            });
            mockTitles = mocks.map(m => m.title);
          }
          
          return {
            id: bundle.id,
            title: bundle.title,
            description: bundle.description || `Contains: ${mockTitles.join(', ')}`,
            price: bundle.discountedPrice || bundle.basePrice,
            createdAt: bundle.createdAt,
            subscribedAt: subscription.createdAt,
            type: 'mockBundle',
            mockCount: bundle.mockIds?.length || 0
          };
        })
    );

    const activeItems = {
      courses: user.enrollments.map(enrollment => ({
        id: enrollment.course.id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        price: enrollment.course.price,
        createdAt: enrollment.course.createdAt,
        enrolledAt: enrollment.enrolledAt,
        type: 'course'
      })),
      mockTests: user.subscriptions
        .filter(sub => sub.mockTest && !sub.course && !sub.mockBundle) // Only individual mock tests
        .map(subscription => ({
          id: subscription.mockTest!.id,
          title: subscription.mockTest!.title,
          description: subscription.mockTest!.description,
          price: subscription.mockTest!.price,
          createdAt: subscription.mockTest!.createdAt,
          subscribedAt: subscription.createdAt,
          type: 'mockTest'
        })),
      mockBundles: mockBundlesWithDetails
    };

    return NextResponse.json({ activeItems }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching active items:", error);
    return NextResponse.json(
      { error: "Failed to fetch active items" },
      { status: 500 }
    );
  }
}