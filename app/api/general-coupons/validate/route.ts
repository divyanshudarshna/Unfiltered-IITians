// app/api/general-coupons/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductType, DiscountType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      code, 
      userId, 
      productType, 
      productId, 
      orderValue 
    } = body;

    // Validation
    if (!code || !userId || !productType || orderValue === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: code, userId, productType, orderValue" },
        { status: 400 }
      );
    }

    // Check if ProductType enum includes the provided value
    if (!Object.values(ProductType).includes(productType as ProductType)) {
      return NextResponse.json({ 
        error: `Invalid product type. Must be one of: ${Object.values(ProductType).join(', ')}` 
      }, { status: 400 });
    }

    // First, find the actual database user ID from Clerk user ID
    let dbUser;
    try {
      dbUser = await prisma.user.findUnique({
        where: { clerkUserId: userId },
        select: { id: true }
      });
      
      if (!dbUser) {
        return NextResponse.json({
          valid: false,
          error: "User not found. Please sign in again."
        }, { status: 400 });
      }
      
    } catch (error) {
      console.error("User lookup failed:", error);
      return NextResponse.json({
        valid: false,
        error: "Failed to verify user. Please try again."
      }, { status: 500 });
    }

    // Now look for coupon with proper user ID
    let coupon;
    try {
      coupon = await prisma.generalCoupon.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          _count: {
            select: { usages: true }
          },
          usages: {
            where: { userId: dbUser.id }, // Use database user ID instead of Clerk ID
            select: { id: true }
          }
        }
      });
      
    } catch (modelError) {
      return NextResponse.json({ 
        error: "Coupon system is not yet available. Please ensure the database schema is updated.",
        details: modelError instanceof Error ? modelError.message : 'Unknown error'
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

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json({
        valid: false,
        error: "This coupon is no longer active"
      }, { status: 400 });
    }

    // Check validity dates with timezone buffer (5 minutes)
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validTill = new Date(coupon.validTill);
    
    // Add buffer for timezone issues
    const bufferMs = 5 * 60 * 1000; // 5 minutes in milliseconds
    const adjustedValidFrom = new Date(validFrom.getTime() - bufferMs);
    
    if (adjustedValidFrom > now) {
      return NextResponse.json({
        valid: false,
        error: `This coupon will be active from ${validFrom.toLocaleDateString()}`
      }, { status: 400 });
    }

    if (validTill <= now) {
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
        finalPrice: finalAmount,
        savings: discountAmount,
        percentage: (discountAmount / orderValue) * 100
      }
    });

  } catch (error) {
    console.error("Validate General Coupon Error:", error);
    return NextResponse.json({ 
      error: "Failed to validate coupon. Please try again later." 
    }, { status: 500 });
  }
}