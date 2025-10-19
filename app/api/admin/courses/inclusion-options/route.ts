// app/api/admin/courses/inclusion-options/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ================== GET INCLUSION OPTIONS ==================
export async function GET() {
  try {
    // Fetch all available options for course inclusions
    const [mockTests, mockBundles, sessions] = await Promise.all([
      // Get published mock tests
      prisma.mockTest.findMany({
        where: {
          status: "PUBLISHED"
        },
        select: {
          id: true,
          title: true,
          price: true,
          actualPrice: true,
          description: true,
          difficulty: true,
        },
        orderBy: {
          title: "asc"
        }
      }),

      // Get published mock bundles
      prisma.mockBundle.findMany({
        where: {
          status: "PUBLISHED"
        },
        select: {
          id: true,
          title: true,
          basePrice: true,
          discountedPrice: true,
          description: true,
          mockIds: true,
        },
        orderBy: {
          title: "asc"
        }
      }),

      // Get published sessions
      prisma.session.findMany({
        where: {
          status: "PUBLISHED"
        },
        select: {
          id: true,
          title: true,
          price: true,
          discountedPrice: true,
          description: true,
          type: true,
          duration: true,
        },
        orderBy: {
          title: "asc"
        }
      })
    ]);

    return NextResponse.json({
      mockTests: mockTests.map(mock => ({
        id: mock.id,
        title: mock.title,
        description: mock.description,
        price: mock.actualPrice || mock.price,
        difficulty: mock.difficulty,
        type: 'MOCK_TEST'
      })),
      mockBundles: mockBundles.map(bundle => ({
        id: bundle.id,
        title: bundle.title,
        description: bundle.description,
        price: bundle.discountedPrice || bundle.basePrice,
        mockCount: bundle.mockIds.length,
        type: 'MOCK_BUNDLE'
      })),
      sessions: sessions.map(session => ({
        id: session.id,
        title: session.title,
        description: session.description,
        price: session.discountedPrice || session.price,
        sessionType: session.type,
        duration: session.duration,
        type: 'SESSION'
      }))
    });

  } catch (error) {
    console.error("❌ Fetch Inclusion Options Error:", error);
    return NextResponse.json({ error: "Failed to fetch inclusion options" }, { status: 500 });
  }
}