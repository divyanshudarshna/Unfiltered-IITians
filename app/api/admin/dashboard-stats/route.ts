import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const totalRevenueCount = await prisma.subscription.count({
    where: { paid: true },
  })

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
    totalRevenue: totalRevenueCount,
    newCustomersCount,
    activeAccounts,
    registeredUsers,
    totalMocks,
    totalCourses,
  })
}
