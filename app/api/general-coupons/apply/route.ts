// app/api/general-coupons/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      code, 
      userId, 
      productType, 
      productId, 
      orderId,
      originalAmount,
      ipAddress,
      userAgent
    } = body;

    // Validation
    if (!code || !userId || !productType || originalAmount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: code, userId, productType, originalAmount" },
        { status: 400 }
      );
    }

    // First validate the coupon (reuse validation logic)
    const validationResponse = await fetch(`${req.nextUrl.origin}/api/general-coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, userId, productType, productId, orderValue: originalAmount })
    });

    if (!validationResponse.ok) {
      const validationError = await validationResponse.json();
      return NextResponse.json(validationError, { status: validationResponse.status });
    }

    const validationData = await validationResponse.json();
    
    if (!validationData.valid) {
      return NextResponse.json(validationData, { status: 400 });
    }

    const { coupon, discount } = validationData;

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the usage record
      const usage = await tx.generalCouponUsage.create({
        data: {
          couponId: coupon.id,
          userId,
          orderId,
          productType,
          productId,
          originalAmount,
          discountAmount: discount.amount,
          finalAmount: discount.finalAmount,
          ipAddress,
          userAgent
        },
        include: {
          coupon: {
            select: {
              id: true,
              code: true,
              name: true,
              discountType: true,
              discountValue: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Update the coupon usage count
      await tx.generalCoupon.update({
        where: { id: coupon.id },
        data: {
          usageCount: {
            increment: 1
          }
        }
      });

      return usage;
    });

    return NextResponse.json({
      success: true,
      message: "Coupon applied successfully",
      usage: {
        id: result.id,
        coupon: result.coupon,
        discount: {
          amount: result.discountAmount,
          originalAmount: result.originalAmount,
          finalAmount: result.finalAmount,
          savings: result.discountAmount,
          percentage: (result.discountAmount / result.originalAmount) * 100
        },
        appliedAt: result.usedAt
      }
    }, { status: 201 });

  } catch (err) {
    console.error("❌ Apply General Coupon Error:", err);
    
    // Check for specific errors
    if (err instanceof Error && err.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: "This coupon has already been applied to this order" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Failed to apply coupon" }, { status: 500 });
  }
}