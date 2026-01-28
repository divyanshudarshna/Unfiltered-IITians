import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { assertAdminApiAccess } from "@/lib/roleAuth"

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
        _count: {
          select: {
            attempts: true,
            subscriptions: true,
          },
        },
      },
    })

    return NextResponse.json({ mocks })
  } catch (error: any) {
    console.error("Error fetching mocks:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const data = await req.json()

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
    const newMock = await prisma.mockTest.create({
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
      },
      select: {
        id: true,
        title: true,
        price: true,
        actualPrice: true,
        duration: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ mock: newMock })
  } catch (error: any) {
    console.error("Error creating mock:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
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
      // full data update
      const updated = await prisma.mockTest.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description || null,
          price: data.price ?? 0,
          actualPrice: data.actualPrice ?? null,
          duration: data.duration ?? null,
          difficulty: data.difficulty ?? "EASY",
          status: data.status ?? "DRAFT",
        },
      })

      return NextResponse.json({ mock: updated })
    }
  } catch (error: any) {
    console.error("Error updating mock:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

