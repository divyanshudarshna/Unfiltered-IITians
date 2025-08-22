// app/api/courses/[id]/coupon/add/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ObjectId } from "mongodb";

interface Params {
  params: { id: string };
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { code, discountPct, validTill } = await req.json();

    if (!code || !discountPct || !validTill) {
      return NextResponse.json(
        { error: "code, discountPct and validTill are required" },
        { status: 400 }
      );
    }

    // Convert courseId to valid ObjectId string
    let courseObjectId: string;
    try {
      courseObjectId = new ObjectId(params.id).toString();
    } catch {
      return NextResponse.json({ error: "Invalid course id" }, { status: 400 });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseObjectId },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check for duplicate code
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountPct,
        validTill: new Date(validTill),
        courseId: courseObjectId,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
