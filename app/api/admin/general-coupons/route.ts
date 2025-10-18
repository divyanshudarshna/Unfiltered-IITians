// app/api/admin/general-coupons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductType, DiscountType } from "@prisma/client";

// 📖 Get all general coupons with optional filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productType = searchParams.get('productType') as ProductType | null;
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where: {
      productType?: ProductType;
      isActive?: boolean;
      OR?: Array<{
        code?: { contains: string; mode: 'insensitive' };
        name?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    // Filter by product type if provided
    if (productType && Object.values(ProductType).includes(productType)) {
      where.productType = productType;
    }

    // Filter by active status if provided
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    // Search in code, name, or description
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const coupons = await prisma.generalCoupon.findMany({
      where,
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
          orderBy: { usedAt: 'desc' },
          take: 10 // Latest 10 usages for each coupon
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { validTill: 'asc' }
      ],
    });

    // Calculate additional stats for each coupon
    const couponsWithStats = coupons.map(coupon => {
      const now = new Date();
      const isExpired = new Date(coupon.validTill) <= now;
      const isUsageLimitReached = coupon.usageLimit ? coupon.usageCount >= coupon.usageLimit : false;
      
      return {
        ...coupon,
        isExpired,
        isUsageLimitReached,
        isEffectivelyActive: coupon.isActive && !isExpired && !isUsageLimitReached,
        usagePercentage: coupon.usageLimit ? (coupon.usageCount / coupon.usageLimit) * 100 : null,
      };
    });

    return NextResponse.json(couponsWithStats);
  } catch (err) {
    console.error("❌ Get General Coupons Error:", err);
    return NextResponse.json({ error: "Failed to fetch general coupons" }, { status: 500 });
  }
}

// ➕ Create new general coupon
export async function POST(req: Request) {
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
      createdBy
    } = body;

    // Validation
    if (!code || !productType || !discountValue || !validTill) {
      return NextResponse.json(
        { error: "Missing required fields: code, productType, discountValue, validTill" },
        { status: 400 }
      );
    }

    if (!Object.values(ProductType).includes(productType)) {
      return NextResponse.json({ error: "Invalid product type" }, { status: 400 });
    }

    if (!Object.values(DiscountType).includes(discountType || DiscountType.PERCENTAGE)) {
      return NextResponse.json({ error: "Invalid discount type" }, { status: 400 });
    }

    // Validate discount value
    if (discountType === DiscountType.PERCENTAGE && (discountValue < 0 || discountValue > 100)) {
      return NextResponse.json({ error: "Percentage discount must be between 0-100" }, { status: 400 });
    }

    if (discountType === DiscountType.FIXED_AMOUNT && discountValue < 0) {
      return NextResponse.json({ error: "Fixed discount amount must be positive" }, { status: 400 });
    }

    // Check if coupon code already exists
    const existingCoupon = await prisma.generalCoupon.findUnique({
      where: { code }
    });

    if (existingCoupon) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
    }

    const coupon = await prisma.generalCoupon.create({
      data: {
        code: code.toUpperCase(),
        name,
        description,
        discountType: discountType || DiscountType.PERCENTAGE,
        discountValue,
        maxDiscountAmt,
        minOrderValue,
        usageLimit,
        userLimit,
        productType,
        productIds: productIds || [],
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validTill: new Date(validTill),
        createdBy,
      },
      include: {
        _count: {
          select: { usages: true }
        }
      }
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (err) {
    console.error("❌ Create General Coupon Error:", err);
    return NextResponse.json({ error: "Failed to create general coupon" }, { status: 500 });
  }
}