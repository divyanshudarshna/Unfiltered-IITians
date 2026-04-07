import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"

import prisma from "@/lib/prisma"
import { CacheKeys, invalidateCache } from "@/lib/cache"

type RevenueSettingsRecord = Awaited<ReturnType<typeof prisma.revenueSettings.findFirst>>

async function authorizeAdmin() {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { role: true, name: true, email: true },
  })

  if (!dbUser || dbUser.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return {
    adminDisplayName: dbUser.name || dbUser.email,
  }
}

async function getOrCreateRevenueSettings() {
  const existing = await prisma.revenueSettings.findFirst()
  if (existing) return existing

  return prisma.revenueSettings.create({
    data: {
      currentRevenue: 0,
      lifetimeRevenue: 0,
      autoResetEnabled: false,
    },
  })
}

function calculateSubscriptionAmount(sub: {
  actualAmountPaid: number | null
  course: { price: number; actualPrice: number | null } | null
  mockTest: { price: number; actualPrice: number | null } | null
  mockBundle: { basePrice: number; discountedPrice: number | null } | null
}) {
  if (sub.actualAmountPaid !== null && sub.actualAmountPaid !== undefined) {
    return sub.actualAmountPaid / 100
  }

  return (
    sub.course?.price ||
    sub.mockTest?.price ||
    sub.mockBundle?.discountedPrice ||
    sub.mockBundle?.basePrice ||
    0
  )
}

async function calculateCurrentRevenue(lastDisbursementDate: Date | null) {
  const paidSubscriptions = await prisma.subscription.findMany({
    where: {
      paid: true,
      ...(lastDisbursementDate && {
        paidAt: { gte: lastDisbursementDate },
      }),
    },
    select: {
      actualAmountPaid: true,
      course: { select: { price: true, actualPrice: true } },
      mockTest: { select: { price: true, actualPrice: true } },
      mockBundle: { select: { basePrice: true, discountedPrice: true } },
    },
  })

  const subscriptionRevenue = paidSubscriptions
    .map(calculateSubscriptionAmount)
    .filter((amount) => amount > 0)
    .reduce((sum, amount) => sum + amount, 0)

  const sessionEnrollments = await prisma.sessionEnrollment.findMany({
    where: {
      paymentStatus: "SUCCESS",
      amountPaid: { not: null, gt: 0 },
      ...(lastDisbursementDate && {
        enrolledAt: { gte: lastDisbursementDate },
      }),
    },
    select: { amountPaid: true },
  })

  const sessionRevenue = sessionEnrollments.reduce((sum, enrollment) => {
    return sum + (enrollment.amountPaid || 0)
  }, 0)

  return subscriptionRevenue + sessionRevenue
}

async function calculateLifetimeRevenue() {
  const allPaidSubscriptions = await prisma.subscription.findMany({
    where: { paid: true },
    select: {
      actualAmountPaid: true,
      course: { select: { price: true, actualPrice: true } },
      mockTest: { select: { price: true, actualPrice: true } },
      mockBundle: { select: { basePrice: true, discountedPrice: true } },
    },
  })

  const lifetimeSubscriptionRevenue = allPaidSubscriptions
    .map(calculateSubscriptionAmount)
    .filter((amount) => amount > 0)
    .reduce((sum, amount) => sum + amount, 0)

  const allSessionEnrollments = await prisma.sessionEnrollment.findMany({
    where: {
      paymentStatus: "SUCCESS",
      amountPaid: { not: null, gt: 0 },
    },
    select: { amountPaid: true },
  })

  const lifetimeSessionRevenue = allSessionEnrollments.reduce((sum, enrollment) => {
    return sum + (enrollment.amountPaid || 0)
  }, 0)

  return lifetimeSubscriptionRevenue + lifetimeSessionRevenue
}

function shouldRunAutoReset(settings: RevenueSettingsRecord, now: Date) {
  if (!settings?.autoResetEnabled) return false

  const resetBoundary = new Date(now.getFullYear(), 3, 1, 0, 0, 0, 0)
  if (now < resetBoundary) return false

  if (!settings.lastResetDate) return true
  return new Date(settings.lastResetDate) < resetBoundary
}

async function refreshRevenueSettings(settings: RevenueSettingsRecord) {
  if (!settings) {
    throw new Error("Revenue settings not initialized")
  }

  const currentRevenue = await calculateCurrentRevenue(settings.lastDisbursementDate)
  const lifetimeRevenue = await calculateLifetimeRevenue()

  if (shouldRunAutoReset(settings, new Date())) {
    const resetDate = new Date()

    if (currentRevenue > 0) {
      await prisma.disbursementHistory.create({
        data: {
          amount: currentRevenue,
          previousBalance: currentRevenue,
          disbursedBy: "System Auto Reset",
          notes: "Automatic yearly reset on April 1st",
          isAutomatic: true,
        },
      })
    }

    const resetSettings = await prisma.revenueSettings.update({
      where: { id: settings.id },
      data: {
        currentRevenue: 0,
        lifetimeRevenue,
        lastDisbursementDate: resetDate,
        lastDisbursementAmount: currentRevenue,
        lastResetDate: resetDate,
      },
    })

    await invalidateCache(CacheKeys.admin.dashboardStats())
    return resetSettings
  }

  if (
    Math.abs(currentRevenue - settings.currentRevenue) > 0.01 ||
    Math.abs(lifetimeRevenue - settings.lifetimeRevenue) > 0.01
  ) {
    return prisma.revenueSettings.update({
      where: { id: settings.id },
      data: {
        currentRevenue,
        lifetimeRevenue,
      },
    })
  }

  return settings
}

export async function GET() {
  try {
    const authResult = await authorizeAdmin()
    if ("error" in authResult) return authResult.error

    const settings = await getOrCreateRevenueSettings()
    const refreshed = await refreshRevenueSettings(settings)

    const disbursementHistory = await prisma.disbursementHistory.findMany({
      orderBy: { disbursementDate: "desc" },
      take: 10,
    })

    return NextResponse.json({
      revenueSettings: refreshed,
      disbursementHistory,
    })
  } catch (error: unknown) {
    console.error("Error fetching revenue settings:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch revenue settings"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const authResult = await authorizeAdmin()
    if ("error" in authResult) return authResult.error

    const body = await request.json()
    const autoResetEnabled = body?.autoResetEnabled

    if (typeof autoResetEnabled !== "boolean") {
      return NextResponse.json({ error: "autoResetEnabled must be a boolean" }, { status: 400 })
    }

    const settings = await getOrCreateRevenueSettings()
    const updated = await prisma.revenueSettings.update({
      where: { id: settings.id },
      data: { autoResetEnabled },
    })

    return NextResponse.json({ revenueSettings: updated })
  } catch (error: unknown) {
    console.error("Error updating revenue settings:", error)
    const message = error instanceof Error ? error.message : "Failed to update revenue settings"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await authorizeAdmin()
    if ("error" in authResult) return authResult.error

    const { password, notes } = await request.json()
    const securityPassword = process.env.SECURITY_PASSWORD

    if (!securityPassword) {
      return NextResponse.json({ error: "Security password not configured" }, { status: 500 })
    }

    if (password !== securityPassword) {
      return NextResponse.json({ error: "Invalid security password" }, { status: 403 })
    }

    const settings = await getOrCreateRevenueSettings()
    const currentRevenue = await calculateCurrentRevenue(settings.lastDisbursementDate)
    const lifetimeRevenue = await calculateLifetimeRevenue()

    if (currentRevenue <= 0) {
      return NextResponse.json({ error: "No revenue to disburse" }, { status: 400 })
    }

    const disbursementDate = new Date()

    const [, updatedSettings] = await prisma.$transaction([
      prisma.disbursementHistory.create({
        data: {
          amount: currentRevenue,
          previousBalance: currentRevenue,
          disbursedBy: authResult.adminDisplayName,
          notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
          isAutomatic: false,
        },
      }),
      prisma.revenueSettings.update({
        where: { id: settings.id },
        data: {
          currentRevenue: 0,
          lifetimeRevenue,
          lastDisbursementDate: disbursementDate,
          lastDisbursementAmount: currentRevenue,
        },
      }),
    ])

    await invalidateCache(CacheKeys.admin.dashboardStats())

    return NextResponse.json({
      message: "Disbursement successful",
      disbursedAmount: currentRevenue,
      revenueSettings: updatedSettings,
    })
  } catch (error: unknown) {
    console.error("Error processing disbursement:", error)
    const message = error instanceof Error ? error.message : "Failed to process disbursement"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
