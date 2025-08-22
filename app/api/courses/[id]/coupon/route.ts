// app/api/courses/[id]/coupon/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ObjectId } from "mongodb";

interface Params {
  params: { id: string };
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const courseObjectId = new ObjectId(params.id);

    console.log("Looking for coupon:", code, "for course:", courseObjectId.toString());

    const coupon = await prisma.coupon.findFirst({
      where: {
        courseId: courseObjectId.toString(), // match ObjectId as string
        code,
        validTill: { gte: new Date() },
      },
    });

    console.log("Coupon result:", coupon);

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid or expired coupon" },
        { status: 404 }
      );
    }

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Error applying coupon:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
