// app/api/admin/courses/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

// ================== GET SINGLE COURSE ==================
export async function GET(req: Request, { params }: Params) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        contents: { include: { lectures: true, quiz: true } },
        coupons: true,
        enrollments: true,
        subscriptions: true,
        inclusions: true, // ✅ Re-enabled after DB migration
      },
    });

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    return NextResponse.json(course);
  } catch (err) {
    console.error("❌ Fetch Course Error:", err);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

// ================== UPDATE COURSE ==================
export async function PUT(req: Request, { params }: Params) {
  console.log("🔄 Admin course update started for ID:", params.id);
  
  try {
    // Validate ObjectId format first
    if (!/^[0-9a-fA-F]{24}$/.test(params.id)) {
      console.error("❌ Invalid ObjectId format:", params.id);
      return NextResponse.json({ error: "Invalid course ID format" }, { status: 400 });
    }

    const body = await req.json();
    console.log("📝 Update Course Request Body:", JSON.stringify(body, null, 2));
    
    const { 
      title, 
      description, 
      price, 
      actualPrice, 
      durationMonths, 
      status, 
      order,
      inclusions // ✅ NEW: Handle inclusions in updates
    } = body;

    console.log("📋 Extracted inclusions:", inclusions);

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!price || Number.isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }

    if (!durationMonths || Number.isNaN(Number(durationMonths)) || Number(durationMonths) < 1) {
      return NextResponse.json({ error: "Valid duration is required" }, { status: 400 });
    }

    // ✅ Validate status - ensure it's a valid PublishStatus enum value
    const validStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
    const validStatus = status && validStatuses.includes(status) ? status : 'DRAFT';
    
    if (status && !validStatuses.includes(status)) {
      console.warn(`Invalid status "${status}" provided, defaulting to DRAFT`);
    }

    // Validate course exists first
    const existingCourse = await prisma.course.findUnique({
      where: { id: params.id }
    });

    if (!existingCourse) {
      console.error("❌ Course not found:", params.id);
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    console.log("✅ Course exists, proceeding with update");

    // Use transaction to update course and inclusions together
    const result = await prisma.$transaction(async (tx) => {
      // Update the course
      console.log("🔄 Updating course with data:", { 
        title: title?.trim(), 
        description: description?.trim() || null, 
        price: Number(price), 
        actualPrice: actualPrice ? Number(actualPrice) : null, 
        durationMonths: Number(durationMonths), 
        status: status && validStatuses.includes(status) ? status : 'DRAFT', 
        order: order ? Number(order) : null 
      });
      
      await tx.course.update({
        where: { id: params.id },
        data: { 
          title: title?.trim(), 
          description: description?.trim() || null, 
          price: Number(price), 
          actualPrice: actualPrice ? Number(actualPrice) : null, 
          durationMonths: Number(durationMonths), 
          status: status && validStatuses.includes(status) ? status : 'DRAFT', // ✅ Use validated status
          order: order ? Number(order) : undefined 
        },
      });

      console.log("✅ Course updated successfully");

      // Handle inclusions if provided
      if (inclusions !== undefined && Array.isArray(inclusions)) {
        console.log("🔄 Processing inclusions:", inclusions);
        
        try {
          // Delete existing inclusions
          const deletedCount = await tx.courseInclusion.deleteMany({
            where: { courseId: params.id }
          });
          console.log("🗑️ Deleted existing inclusions:", deletedCount.count);

          // Create new inclusions if any
          if (inclusions.length > 0) {
            // Validate inclusion data
            const inclusionData = inclusions.map((inclusion: any, index: number) => {
              console.log(`📋 Processing inclusion ${index}:`, inclusion);
              
              if (!inclusion.type || !inclusion.id) {
                throw new Error(`Invalid inclusion at index ${index}: missing type or id`);
              }

              if (!['MOCK_TEST', 'MOCK_BUNDLE', 'SESSION'].includes(inclusion.type)) {
                throw new Error(`Invalid inclusion type: ${inclusion.type}`);
              }

              // Validate ObjectId format for inclusion ID
              if (!/^[0-9a-fA-F]{24}$/.test(inclusion.id)) {
                throw new Error(`Invalid inclusion ID format at index ${index}: ${inclusion.id}`);
              }

              return {
                courseId: params.id,
                inclusionType: inclusion.type,
                inclusionId: inclusion.id,
              };
            });

            console.log("📦 Creating inclusions:", inclusionData);

            const createdInclusions = await tx.courseInclusion.createMany({
              data: inclusionData,
            });
            
            console.log("✅ Created inclusions:", createdInclusions.count);
          }
        } catch (inclusionError: any) {
          console.error("❌ Inclusion processing error:", inclusionError);
          throw new Error(`Inclusion error: ${inclusionError.message}`);
        }
      } else {
        console.log("ℹ️ No inclusions to process");
      }

      // Return updated course with inclusions
      const finalCourse = await tx.course.findUnique({
        where: { id: params.id },
        include: {
          inclusions: true,
        },
      });

      return finalCourse;
    });

    console.log("✅ Transaction completed successfully");
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("❌ Update Course Error:", err);
    console.error("❌ Error details:", {
      message: err.message,
      code: err.code,
      meta: err.meta,
      stack: err.stack
    });
    
    return NextResponse.json({ 
      error: "Failed to update course",
      details: err.message 
    }, { status: 500 });
  }
}

// ================== DELETE COURSE ==================
export async function DELETE(req: Request, { params }: Params) {
  try {
    await prisma.course.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Delete Course Error:", err);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
