// app/api/admin/general-coupons/stats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get overall statistics
    const [
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      totalUsages,
      recentUsages
    ] = await Promise.all([
      // Total coupons
      prisma.generalCoupon.count(),
      
      // Active coupons (active and not expired)
      prisma.generalCoupon.count({
        where: {
          isActive: true,
          validTill: {
            gt: new Date()
          }
        }
      }),
      
      // Expired coupons
      prisma.generalCoupon.count({
        where: {
          validTill: {
            lte: new Date()
          }
        }
      }),
      
      // Total usage count
      prisma.generalCouponUsage.count(),
      
      // Recent usages (last 30 days)
      prisma.generalCouponUsage.count({
        where: {
          usedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          }
        }
      })
    ]);

    // Get usage by product type
    const usageByProductType = await prisma.generalCouponUsage.groupBy({
      by: ['productType'],
      _count: {
        id: true
      },
      _sum: {
        discountAmount: true,
        originalAmount: true
      }
    });

    // Get top performing coupons
    const topCoupons = await prisma.generalCoupon.findMany({
      take: 5,
      orderBy: {
        usageCount: 'desc'
      },
      select: {
        id: true,
        code: true,
        name: true,
        usageCount: true,
        productType: true,
        _count: {
          select: { usages: true }
        }
      }
    });

    // Calculate total discount given
    const totalDiscountGiven = await prisma.generalCouponUsage.aggregate({
      _sum: {
        discountAmount: true
      }
    });

    // Get monthly usage trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyUsage = await prisma.generalCouponUsage.findMany({
      where: {
        usedAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        usedAt: true,
        discountAmount: true
      }
    });

    // Group by month
    const monthlyStats = monthlyUsage.reduce((acc: any[], usage) => {
      const month = usage.usedAt.toISOString().slice(0, 7); // YYYY-MM format
      
      const existingMonth = acc.find(item => item.month === month);
      if (existingMonth) {
        existingMonth.count += 1;
        existingMonth.totalDiscount += usage.discountAmount;
      } else {
        acc.push({
          month,
          count: 1,
          totalDiscount: usage.discountAmount
        });
      }
      
      return acc;
    }, []);

    return NextResponse.json({
      overview: {
        totalCoupons,
        activeCoupons,
        expiredCoupons,
        inactiveCoupons: totalCoupons - activeCoupons - expiredCoupons,
        totalUsages,
        recentUsages,
        totalDiscountGiven: totalDiscountGiven._sum.discountAmount || 0
      },
      usageByProductType: usageByProductType.map(item => ({
        productType: item.productType,
        count: item._count.id,
        totalDiscount: item._sum.discountAmount || 0,
        totalOriginalAmount: item._sum.originalAmount || 0
      })),
      topCoupons,
      monthlyTrend: monthlyStats.sort((a, b) => a.month.localeCompare(b.month))
    });

  } catch (err) {
    console.error("❌ Get General Coupon Stats Error:", err);
    return NextResponse.json({ error: "Failed to fetch coupon statistics" }, { status: 500 });
  }
}