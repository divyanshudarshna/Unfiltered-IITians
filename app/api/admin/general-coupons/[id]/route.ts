// app/api/admin/general-coupons/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductType, DiscountType } from "@prisma/client";

interface Params {
  params: { id: string };
}

// 📖 Get single general coupon by ID
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const coupon = await prisma.generalCoupon.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { usages: true }
        },
        usages: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { usedAt: 'desc' }
        }
      }
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Calculate additional stats
    const now = new Date();
    const isExpired = new Date(coupon.validTill) <= now;
    const isUsageLimitReached = coupon.usageLimit ? coupon.usageCount >= coupon.usageLimit : false;

    const couponWithStats = {
      ...coupon,
      isExpired,
      isUsageLimitReached,
      isEffectivelyActive: coupon.isActive && !isExpired && !isUsageLimitReached,
      usagePercentage: coupon.usageLimit ? (coupon.usageCount / coupon.usageLimit) * 100 : null,
    };

    return NextResponse.json(couponWithStats);
  } catch (err) {
    console.error("❌ Get General Coupon Error:", err);
    return NextResponse.json({ error: "Failed to fetch general coupon" }, { status: 500 });
  }
}

// ✏️ Update general coupon
export async function PUT(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      maxDiscountAmt,
      minOrderValue,
      usageLimit,
      userLimit,
      productType,
      productIds,
      validFrom,
      validTill,
      isActive
    } = body;

    // Check if coupon exists
    const existingCoupon = await prisma.generalCoupon.findUnique({
      where: { id: params.id }
    });

    if (!existingCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // If updating code, check for conflicts
    if (code && code !== existingCoupon.code) {
      const codeConflict = await prisma.generalCoupon.findUnique({
        where: { code: code.toUpperCase() }
      });

      if (codeConflict) {
        return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
      }
    }

    // Validation
    if (productType && !Object.values(ProductType).includes(productType)) {
      return NextResponse.json({ error: "Invalid product type" }, { status: 400 });
    }

    if (discountType && !Object.values(DiscountType).includes(discountType)) {
      return NextResponse.json({ error: "Invalid discount type" }, { status: 400 });
    }

    // Validate discount value
    if (discountValue !== undefined) {
      const type = discountType || existingCoupon.discountType;
      if (type === DiscountType.PERCENTAGE && (discountValue < 0 || discountValue > 100)) {
        return NextResponse.json({ error: "Percentage discount must be between 0-100" }, { status: 400 });
      }
      if (type === DiscountType.FIXED_AMOUNT && discountValue < 0) {
        return NextResponse.json({ error: "Fixed discount amount must be positive" }, { status: 400 });
      }
    }

    const updatedCoupon = await prisma.generalCoupon.update({
      where: { id: params.id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(discountType && { discountType }),
        ...(discountValue !== undefined && { discountValue }),
        ...(maxDiscountAmt !== undefined && { maxDiscountAmt }),
        ...(minOrderValue !== undefined && { minOrderValue }),
        ...(usageLimit !== undefined && { usageLimit }),
        ...(userLimit !== undefined && { userLimit }),
        ...(productType && { productType }),
        ...(productIds !== undefined && { productIds }),
        ...(validFrom && { validFrom: new Date(validFrom) }),
        ...(validTill && { validTill: new Date(validTill) }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        _count: {
          select: { usages: true }
        }
      }
    });

    return NextResponse.json(updatedCoupon);
  } catch (err) {
    console.error("❌ Update General Coupon Error:", err);
    return NextResponse.json({ error: "Failed to update general coupon" }, { status: 500 });
  }
}

// ❌ Delete general coupon
export async function DELETE(req: Request, { params }: Params) {
  try {
    // Check if coupon exists
    const existingCoupon = await prisma.generalCoupon.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { usages: true }
        }
      }
    });

    if (!existingCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Optional: Prevent deletion if coupon has been used
    if (existingCoupon._count.usages > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete coupon that has been used. Consider deactivating it instead.",
          usageCount: existingCoupon._count.usages
        }, 
        { status: 409 }
      );
    }

    await prisma.generalCoupon.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true, message: "Coupon deleted successfully" });
  } catch (err) {
    console.error("❌ Delete General Coupon Error:", err);
    return NextResponse.json({ error: "Failed to delete general coupon" }, { status: 500 });
  }
}