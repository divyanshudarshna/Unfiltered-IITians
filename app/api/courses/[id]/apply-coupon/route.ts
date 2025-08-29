// app/api/courses/[id]/apply-coupon/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { code } = await req.json();
    const courseId = params.id;

    const coupon = await prisma.coupon.findFirst({
      where: { courseId, code, validTill: { gte: new Date() } },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, message: "Invalid or expired coupon" });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ valid: false, message: "Course not found" });
    }

    const discountAmount = Math.floor((course.price * coupon.discountPct) / 100);
    const newPrice = course.price - discountAmount;

    return NextResponse.json({
      valid: true,
      discountPct: coupon.discountPct,
      discountAmount,
      newPrice,
      couponId: coupon.id,
    });
  } catch (err) {
    console.error("❌ Apply coupon error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
