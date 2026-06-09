// app/api/general-coupons/public/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isGeneralCouponPublicForProduct,
  toPublicGeneralCoupon,
  type GeneralCouponProductType,
} from "@/lib/general-coupon-public";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productType = searchParams.get("productType");
    const productId = searchParams.get("productId");
    const orderValueParam = searchParams.get("orderValue");
    const orderValue = orderValueParam ? Number(orderValueParam) : undefined;

    if (!productType || !Object.values(ProductType).includes(productType as ProductType)) {
      return NextResponse.json({ error: "Invalid product type" }, { status: 400 });
    }

    const now = new Date();
    const coupons = await prisma.generalCoupon.findMany({
      where: {
        productType: productType as ProductType,
        isActive: true,
        isPublic: true,
        validFrom: { lte: now },
        validTill: { gt: now },
      },
      orderBy: { validTill: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        discountType: true,
        discountValue: true,
        maxDiscountAmt: true,
        minOrderValue: true,
        usageLimit: true,
        usageCount: true,
        productType: true,
        productIds: true,
        validFrom: true,
        validTill: true,
        isActive: true,
        isPublic: true,
      },
    });

    const publicCoupons = coupons
      .filter((coupon) =>
        isGeneralCouponPublicForProduct(
          coupon,
          productType as GeneralCouponProductType,
          productId,
          Number.isFinite(orderValue) ? orderValue : undefined,
          now
        )
      )
      .map(toPublicGeneralCoupon);

    return NextResponse.json(publicCoupons);
  } catch (err) {
    console.error("❌ Get Public General Coupons Error:", err);
    return NextResponse.json({ error: "Failed to fetch public coupons" }, { status: 500 });
  }
}
