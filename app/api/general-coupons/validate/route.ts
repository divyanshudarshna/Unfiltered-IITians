// app/api/general-coupons/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductType, DiscountType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    console.log("🔍 Validating coupon...");
    
    const body = await req.json();
    console.log("📄 Request body:", body);
    
    const { 
      code, 
      userId, 
      productType, 
      productId, 
      orderValue 
    } = body;

    // Validation
    if (!code || !userId || !productType || orderValue === undefined) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: code, userId, productType, orderValue" },
        { status: 400 }
      );
    }

    console.log("✅ Basic validation passed");

    // Check if ProductType enum includes the provided value
    if (!Object.values(ProductType).includes(productType as ProductType)) {
      console.log("❌ Invalid product type:", productType);
      console.log("📝 Available ProductType values:", Object.values(ProductType));
      return NextResponse.json({ 
        error: `Invalid product type. Must be one of: ${Object.values(ProductType).join(', ')}` 
      }, { status: 400 });
    }

    console.log("🔍 Looking for coupon with code:", code.toUpperCase());

    // Check if GeneralCoupon model exists by testing a simple query first
    let coupon;
    try {
      coupon = await prisma.generalCoupon.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          _count: {
            select: { usages: true }
          },
          usages: {
            where: { userId },
            select: { id: true }
          }
        }
      });
      console.log("🎫 Coupon lookup result:", coupon ? "Found" : "Not found");
    } catch (modelError) {
      console.error("❌ GeneralCoupon model error:", modelError);
      return NextResponse.json({ 
        error: "Coupon system is not yet available. Please ensure the database schema is updated." 
      }, { status: 503 });
    }

    if (!coupon) {
      return NextResponse.json(
        { 
          valid: false, 
          error: "Invalid coupon code" 
        }, 
        { status: 404 }
      );
    }

    console.log("🎫 Coupon validation started");

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json({
        valid: false,
        error: "This coupon is no longer active"
      }, { status: 400 });
    }

    // Check validity dates
    const now = new Date();
    if (new Date(coupon.validFrom) > now) {
      return NextResponse.json({
        valid: false,
        error: "This coupon is not yet active"
      }, { status: 400 });
    }

    if (new Date(coupon.validTill) <= now) {
      return NextResponse.json({
        valid: false,
        error: "This coupon has expired"
      }, { status: 400 });
    }

    // Check product type
    if (coupon.productType !== productType) {
      return NextResponse.json({
        valid: false,
        error: `This coupon is only valid for ${coupon.productType.replace('_', ' ').toLowerCase()}s`
      }, { status: 400 });
    }

    // Check specific product IDs if specified
    if (coupon.productIds.length > 0 && productId && !coupon.productIds.includes(productId)) {
      return NextResponse.json({
        valid: false,
        error: "This coupon is not valid for this specific product"
      }, { status: 400 });
    }

    // Check minimum order value
    if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`
      }, { status: 400 });
    }

    // Check usage limits
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({
        valid: false,
        error: "This coupon has reached its usage limit"
      }, { status: 400 });
    }

    // Check per-user usage limit
    if (coupon.userLimit && coupon.usages.length >= coupon.userLimit) {
      return NextResponse.json({
        valid: false,
        error: "You have already used this coupon the maximum number of times"
      }, { status: 400 });
    }

    // Calculate discount
    let discountAmount = 0;
    
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (orderValue * coupon.discountValue) / 100;
      
      // Apply max discount limit if specified
      if (coupon.maxDiscountAmt && discountAmount > coupon.maxDiscountAmt) {
        discountAmount = coupon.maxDiscountAmt;
      }
    } else {
      // Fixed amount discount
      discountAmount = Math.min(coupon.discountValue, orderValue);
    }

    const finalAmount = Math.max(0, orderValue - discountAmount);

    console.log("✅ Coupon validation successful");
    console.log("💰 Discount calculated:", { discountAmount, finalAmount, orderValue });

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

  } catch (err) {
    console.error("❌ Validate General Coupon Error:", err);
    console.error("Error details:", {
      name: err instanceof Error ? err.name : 'Unknown',
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : 'No stack trace'
    });
    return NextResponse.json({ 
      error: "Failed to validate coupon. Please try again later." 
    }, { status: 500 });
  }
}