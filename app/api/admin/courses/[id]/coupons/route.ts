// app/api/admin/courses/[id]/coupons/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string }; // courseId
}

// ➕ Create coupon
export async function POST(req: Request, { params }: Params) {
  try {
    const { code, discountPct, validTill } = await req.json();

    if (!code || !discountPct || !validTill) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountPct,
        validTill: new Date(validTill),
        courseId: params.id,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (err) {
    console.error("❌ Create Coupon Error:", err);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}

// 📖 Get all coupons for a course
export async function GET(req: Request, { params }: Params) {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { courseId: params.id },
      orderBy: { validTill: "asc" },
    });

    return NextResponse.json(coupons);
  } catch (err) {
    console.error("❌ Get Coupons Error:", err);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

// ✏️ Update coupon
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id, code, discountPct, validTill } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Coupon ID required" }, { status: 400 });
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        code,
        discountPct,
        validTill: validTill ? new Date(validTill) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("❌ Update Coupon Error:", err);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

// ❌ Delete coupon
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Coupon ID required" }, { status: 400 });
    }

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Delete Coupon Error:", err);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
