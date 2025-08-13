import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
// import { auth } from "@clerk/nextjs/server"

export async function GET() {
  try {
    // Verify admin authentication
    // const { userId } = auth().protect()
    
    // const adminUser = await prisma.user.findUnique({
    //   where: { clerkUserId: userId, role: 'ADMIN' }
    // })
    
    // if (!adminUser) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    // Get all mocks with optional query params
 const mocks = await prisma.mockTest.findMany({
  orderBy: { createdAt: "desc" },
  select: {
    id: true,
    title: true,
    description: true,
    price: true,
    difficulty: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    questions: true,  // <-- Add this
    _count: {
      select: {
        attempts: true,
        subscriptions: true
      }
    }
  }
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
    // Verify admin authentication
    // const { userId } = auth().protect()
    
    // const adminUser = await prisma.user.findUnique({
    //   where: { clerkUserId: userId, role: 'ADMIN' }
    // })
    
    // if (!adminUser) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const data = await req.json()

    // Validate required fields
    if (!data.title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    // Create new mock test
    const newMock = await prisma.mockTest.create({
      data: {
        title: data.title,
        description: data.description || null,
        price: data.price || 0,
        difficulty: data.difficulty || "EASY",
        status: data.status || "DRAFT",
        questions: data.questions || [],
        tags: data.tags || []
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      }
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

// Add this new endpoint for status updates
export async function PUT(req: Request) {
  try {
    // Verify admin authentication
    // const { userId } = auth().protect()
    
    // const adminUser = await prisma.user.findUnique({
    //   where: { clerkUserId: userId, role: 'ADMIN' }
    // })
    
    // if (!adminUser) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const action = searchParams.get('action')

    if (!id || !action) {
      return NextResponse.json(
        { error: "Missing ID or action parameter" },
        { status: 400 }
      )
    }

    // Validate action
    if (!['publish', 'unpublish', 'archive'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      )
    }

    // Determine new status
    let newStatus
    switch (action) {
      case 'publish':
        newStatus = 'PUBLISHED'
        break
      case 'unpublish':
        newStatus = 'DRAFT'
        break
      case 'archive':
        newStatus = 'ARCHIVED'
        break
      default:
        newStatus = 'DRAFT'
    }

    // Update mock status
    const updatedMock = await prisma.mockTest.update({
      where: { id },
      data: { status: newStatus },
      select: {
        id: true,
        title: true,
        status: true
      }
    })

    return NextResponse.json({ mock: updatedMock })
  } catch (error: any) {
    console.error("Error updating mock status:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    )
  }
}