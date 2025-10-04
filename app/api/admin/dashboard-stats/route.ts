import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  // Calculate actual revenue from paid subscriptions
  const paidSubscriptions = await prisma.subscription.findMany({
    where: { paid: true },
    include: {
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

  // Calculate total revenue based on actual prices
  const totalRevenue = paidSubscriptions.reduce((sum, sub) => {
    let itemPrice = 0;
    if (sub.mockTest) {
      itemPrice = sub.mockTest.actualPrice || sub.mockTest.price;
    } else if (sub.course) {
      itemPrice = sub.course.actualPrice || sub.course.price;
    }
    return sum + itemPrice;
  }, 0);

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
