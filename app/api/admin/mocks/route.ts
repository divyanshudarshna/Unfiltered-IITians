import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { assertAdminApiAccess } from "@/lib/roleAuth"
import { CommerceBillingInputError, hasCommerceBillingInput, normalizeCommerceBillingInput } from "@/lib/commerce-billing"
import { createOrVersionCommerceBillingPlan } from "@/lib/commerce-billing-plan"

export async function GET(req: Request) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const mocks = await prisma.mockTest.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        actualPrice: true,   // ✅ added
        duration: true,      // ✅ added
        difficulty: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        questions: true,
        billingMode: true,
        subscriptionEnabled: true,
        _count: {
          select: {
            attempts: true,
            subscriptions: true,
          },
        },
      },
    })

    const plans = await prisma.commerceBillingPlan.findMany({
      where: { productType: "MOCK_TEST", productId: { in: mocks.map((mock) => mock.id) } },
      orderBy: { version: "desc" },
    })
    const plansByMock = new Map<string, typeof plans>()
    for (const plan of plans) {
      const current = plansByMock.get(plan.productId) ?? []
      current.push(plan)
      plansByMock.set(plan.productId, current)
    }
    return NextResponse.json({ mocks: mocks.map((mock) => ({ ...mock, billingPlans: plansByMock.get(mock.id) ?? [] })) })
  } catch (error: unknown) {
    console.error("Error fetching mocks:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const data = await req.json()
    const billing = normalizeCommerceBillingInput(data)

    // Validate required fields
    if (!data.title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }
    if (data.actualPrice == null) {
      return NextResponse.json(
        { error: "Actual price is required" },
        { status: 400 }
      )
    }
    if (data.duration == null) {
      return NextResponse.json(
        { error: "Duration is required" },
        { status: 400 }
      )
    }

    // Create new mock test
    const newMock = await prisma.$transaction(async (tx) => {
      const mock = await tx.mockTest.create({
        data: {
        title: data.title,
        description: data.description || null,
        price: data.price || 0,
        actualPrice: data.actualPrice,
        duration: data.duration,
        difficulty: data.difficulty || "EASY",
        status: data.status || "DRAFT",
        questions: data.questions || [],
        tags: data.tags || [],
          billingMode: billing.billingMode,
          subscriptionEnabled: billing.subscriptionEnabled,
        },
      })
      await createOrVersionCommerceBillingPlan(tx, {
        productType: "MOCK_TEST",
        productId: mock.id,
        billing,
      })
      return tx.mockTest.findUniqueOrThrow({
        where: { id: mock.id },
        select: {
        id: true,
        title: true,
        price: true,
        actualPrice: true,
        duration: true,
        status: true,
        createdAt: true,
          billingMode: true,
          subscriptionEnabled: true,
        },
      })
    })

    return NextResponse.json({ mock: newMock })
  } catch (error: unknown) {
    if (error instanceof CommerceBillingInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Error creating mock:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    )
  }
}
export async function PUT(req: Request) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const action = searchParams.get("action")

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 })
    }

    const data = await req.json().catch(() => ({}))

    if (action) {
      // status-only updates
      let newStatus
      switch (action) {
        case "publish": newStatus = "PUBLISHED"; break
        case "unpublish": newStatus = "DRAFT"; break
        case "archive": newStatus = "ARCHIVED"; break
        default: newStatus = "DRAFT"
      }

      const updated = await prisma.mockTest.update({
        where: { id },
        data: { status: newStatus },
        select: { id: true, title: true, status: true }
      })

      return NextResponse.json({ mock: updated })
    } else {
      const billing = hasCommerceBillingInput(data) ? normalizeCommerceBillingInput(data) : null
      // full data update
      const updated = await prisma.$transaction(async (tx) => {
        const mock = await tx.mockTest.update({
          where: { id },
          data: {
          title: data.title,
          description: data.description || null,
          price: data.price ?? 0,
          actualPrice: data.actualPrice ?? null,
          duration: data.duration ?? null,
          difficulty: data.difficulty ?? "EASY",
          status: data.status ?? "DRAFT",
            ...(billing ? { billingMode: billing.billingMode, subscriptionEnabled: billing.subscriptionEnabled } : {}),
          },
        })
        await createOrVersionCommerceBillingPlan(tx, {
          productType: "MOCK_TEST",
          productId: mock.id,
          billing: billing ?? { billingMode: "ONE_TIME", subscriptionEnabled: false, amountPaise: null, interval: "monthly", totalCount: 120 },
        })
        return mock
      })

      return NextResponse.json({ mock: updated })
    }
  } catch (error: unknown) {
    if (error instanceof CommerceBillingInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Error updating mock:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}

