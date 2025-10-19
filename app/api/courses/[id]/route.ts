import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        contents: {
          orderBy: { order: "asc" },
          include: {
            lectures: { orderBy: { order: "asc" } },
            quiz: true,
          },
        },
        coupons: true,
        inclusions: true, // Get raw inclusions first
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Manually fetch the related inclusion data
    const inclusionsWithData = await Promise.all(
      course.inclusions.map(async (inclusion) => {
        let relatedData = null;
        
        try {
          switch (inclusion.inclusionType) {
            case 'MOCK_TEST':
              relatedData = await prisma.mockTest.findUnique({
                where: { id: inclusion.inclusionId }
              });
              return {
                ...inclusion,
                mockTest: relatedData
              };
              
            case 'MOCK_BUNDLE':
              relatedData = await prisma.mockBundle.findUnique({
                where: { id: inclusion.inclusionId }
              });
              return {
                ...inclusion,
                mockBundle: relatedData
              };
              
            case 'SESSION':
              relatedData = await prisma.session.findUnique({
                where: { id: inclusion.inclusionId }
              });
              return {
                ...inclusion,
                session: relatedData
              };
              
            default:
              return inclusion;
          }
        } catch (error) {
          console.error(`Error fetching ${inclusion.inclusionType} with ID ${inclusion.inclusionId}:`, error);
          return inclusion; // Return inclusion without related data if fetch fails
        }
      })
    );

    // Ensure actualPrice fallback to price if missing
    const responseData = {
      ...course,
      actualPrice: course.actualPrice ?? course.price,
      price: course.price,
      inclusions: inclusionsWithData, // Replace with enriched inclusions
    };

    return NextResponse.json(responseData);
  } catch (err) {
    console.error("❌ Course details error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
