// Test API to check GeneralCoupon status
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test basic database connection
    const userCount = await prisma.user.count();
    // console.log("User count:", userCount);

    // Test GeneralCoupon model
    const couponCount = await prisma.generalCoupon.count();
    // console.log("GeneralCoupon count:", couponCount);

    // Get first few coupons
    const coupons = await prisma.generalCoupon.findMany({
      take: 3,
      select: {
        id: true,
        code: true,
        productType: true,
        isActive: true,
        validTill: true
      }
    });

    return NextResponse.json({
      success: true,
      userCount,
      couponCount,
      sampleCoupons: coupons
    });

  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    
    // console.log("Testing specific coupon:", code);
    
    const coupon = await prisma.generalCoupon.findUnique({
      where: { code: code?.toUpperCase() || "NONEXISTENT" }
    });
    
    return NextResponse.json({
      success: true,
      found: !!coupon,
      coupon: coupon ? {
        id: coupon.id,
        code: coupon.code,
        productType: coupon.productType,
        isActive: coupon.isActive,
        validTill: coupon.validTill
      } : null
    });
    
  } catch (error) {
    console.error("Coupon test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}