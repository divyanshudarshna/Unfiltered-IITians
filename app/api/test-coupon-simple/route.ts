// Temporary bypass for date validation to test the coupon system
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductType, DiscountType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // console.log("🔍 Testing coupon without date validation");
    
    const body = await req.json();
    const { code, userId, productType, orderValue } = body;

    // Basic validation
    if (!code || !userId || !productType || orderValue === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find database user
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true }
    });

    if (!dbUser) {
      return NextResponse.json({ valid: false, error: "User not found" }, { status: 400 });
    }

    // Find coupon
    const coupon = await prisma.generalCoupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code" }, { status: 404 });
    }

    console.log("🎫 Found coupon:", {
      code: coupon.code,
      isActive: coupon.isActive,
      productType: coupon.productType,
      validFrom: coupon.validFrom,
      validTill: coupon.validTill,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });

    // Skip date validation for now, just check active status and product type
    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, error: "Coupon is not active" }, { status: 400 });
    }

    if (coupon.productType !== productType) {
      return NextResponse.json({
        valid: false,
        error: `This coupon is only valid for ${coupon.productType.replace('_', ' ').toLowerCase()}s`
      }, { status: 400 });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (orderValue * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmt && discountAmount > coupon.maxDiscountAmt) {
        discountAmount = coupon.maxDiscountAmt;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, orderValue);
    }

    const finalAmount = Math.max(0, orderValue - discountAmount);

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      },
      discount: {
        amount: discountAmount,
        originalAmount: orderValue,
        finalAmount,
        savings: discountAmount,
        percentage: (discountAmount / orderValue) * 100
      }
    });

  } catch (error) {
    console.error("Test coupon error:", error);
    return NextResponse.json({ error: "Test failed" }, { status: 500 });
  }
}