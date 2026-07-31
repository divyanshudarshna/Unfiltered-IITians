import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id, status: "PUBLISHED" },
      include: {
        contents: {
          orderBy: { order: "asc" },
          include: {
            lectures: {
              orderBy: { order: "asc" },
              select: { id: true, title: true, order: true, isFreePreview: true },
            },
            quiz: { select: { id: true } },
          },
        },
        coupons: true,
        inclusions: true, // Get raw inclusions first
        // ✅ Instructor full profiles
        courseInstructors: {
          orderBy: { order: "asc" },
          include: {
            instructor: {
              select: {
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
                isActive: true,
                order: true,
              },
            },
          },
        },
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
                where: { id: inclusion.inclusionId },
                select: { id: true, title: true, description: true, difficulty: true, price: true },
              });
              return {
                ...inclusion,
                mockTest: relatedData
              };
              
            case 'MOCK_BUNDLE':
              relatedData = await prisma.mockBundle.findUnique({
                where: { id: inclusion.inclusionId },
                select: { id: true, title: true, description: true, basePrice: true, discountedPrice: true, mockIds: true },
              });
              return {
                ...inclusion,
                mockBundle: relatedData
              };
              
            case 'SESSION':
              relatedData = await prisma.session.findUnique({
                where: { id: inclusion.inclusionId },
                select: { id: true, title: true, description: true, type: true, duration: true, price: true, discountedPrice: true },
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

    // Flatten instructor data from join table, sorted by Instructor.order ascending
    const instructors = course.courseInstructors
      .map((ci) => ci.instructor)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Ensure actualPrice fallback to price if missing
    const responseData = {
      ...course,
      actualPrice: course.actualPrice ?? course.price,
      price: course.price,
      inclusions: inclusionsWithData, // Replace with enriched inclusions
      instructors, // ✅ Flattened instructor profiles
      hasFreePreview: course.contents.some((content) =>
        content.lectures.some((lecture) => lecture.isFreePreview),
      ),
      firstFreeLectureId: course.contents
        .flatMap((content) => content.lectures)
        .find((lecture) => lecture.isFreePreview)?.id ?? null,
    };

    return NextResponse.json(responseData);
  } catch (err) {
    console.error("❌ Course details error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
