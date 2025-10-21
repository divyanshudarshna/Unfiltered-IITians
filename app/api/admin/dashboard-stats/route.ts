import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  // ✅ Get ALL successful subscriptions - replicate admin/stats logic exactly
  const paidSubscriptions = await prisma.subscription.findMany({
    where: { paid: true },
    select: {
      actualAmountPaid: true,
      originalPrice: true,
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
      },
      mockBundle: {
        select: {
          basePrice: true,
          discountedPrice: true,
        }
      }
    }
  });

  // ✅ Calculate subscription revenue - EXACT same logic as admin/stats
  const subscriptionRevenue = paidSubscriptions
    .map(sub => {
      // Calculate actual amount paid - prioritize actualAmountPaid field
      let actualAmount = 0;
      if (sub.actualAmountPaid !== null && sub.actualAmountPaid !== undefined) {
        actualAmount = sub.actualAmountPaid / 100; // Convert paise to rupees
      } else {
        // Only use fallback pricing for old records that don't have actualAmountPaid set
        actualAmount = sub.course?.price || sub.mockTest?.price || sub.mockBundle?.discountedPrice || sub.mockBundle?.basePrice || 0;
      }
      return actualAmount;
    })
    .filter(amount => amount > 0) // ✅ Filter out zero amount transactions - CRITICAL
    .reduce((sum, amount) => sum + amount, 0);

  // ✅ Get session enrollment revenue - only SUCCESS payments with non-null amounts
  const successfulSessionEnrollments = await prisma.sessionEnrollment.findMany({
    where: { 
      paymentStatus: "SUCCESS",
      amountPaid: { not: null, gt: 0 } // ✅ Exclude zero amounts
    },
    select: {
      amountPaid: true
    }
  });

  const sessionRevenue = successfulSessionEnrollments.reduce((sum, enrollment) => {
    return sum + (enrollment.amountPaid || 0);
  }, 0);

  const totalRevenue = subscriptionRevenue + sessionRevenue;

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
