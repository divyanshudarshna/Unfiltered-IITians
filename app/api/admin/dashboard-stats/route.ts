import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  // ✅ Calculate actual revenue from paid subscriptions using actualAmountPaid
  const paidSubscriptions = await prisma.subscription.findMany({
    where: { paid: true },
    select: {
      actualAmountPaid: true,  // ✅ NEW: Use actual payment amount
      originalPrice: true,     // ✅ NEW: For reference
      mockTest: {
        select: {
          price: true,
          actualPrice: true,
        }
      },
      course: {
        select: {
          price: true,
          actualPrice: true,
        }
      }
    }
  });

  // ✅ Calculate subscription revenue using actualAmountPaid
  const subscriptionRevenue = paidSubscriptions.reduce((sum, sub) => {
    // Use actualAmountPaid if available (new field), otherwise fallback to old method
    if (sub.actualAmountPaid) {
      return sum + (sub.actualAmountPaid / 100); // Convert from paise to rupees
    }
    
    // Fallback for old records (before actualAmountPaid was implemented)
    let itemPrice = 0;
    if (sub.mockTest) {
      itemPrice = sub.mockTest.actualPrice || sub.mockTest.price;
    } else if (sub.course) {
      itemPrice = sub.course.actualPrice || sub.course.price;
    }
    return sum + itemPrice;
  }, 0);

  // ✅ Calculate session enrollment revenue
  const sessionRevenue = await prisma.sessionEnrollment.aggregate({
    where: { 
      paymentStatus: "SUCCESS",
      amountPaid: { not: null }
    },
    _sum: {
      amountPaid: true
    }
  });

  const totalRevenue = subscriptionRevenue + (sessionRevenue._sum.amountPaid || 0);

  const newCustomersCount = await prisma.user.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  })

  const activeAccounts = await prisma.user.count({
    where: { isSubscribed: true },
  })

  // Additional counts:
  const registeredUsers = await prisma.user.count()

  const totalMocks = await prisma.mockTest.count()

  const totalCourses = await prisma.course.count()

  return NextResponse.json({
    totalRevenue,
    newCustomersCount,
    activeAccounts,
    registeredUsers,
    totalMocks,
    totalCourses,
  })
}
