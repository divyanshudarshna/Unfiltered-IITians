import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess } from "@/lib/roleAuth";

export async function GET(req: Request) {
  // Fetch all bundles ordered by display order
  try {
    await assertAdminApiAccess(req.url, req.method);
    const bundles = await prisma.mockBundle.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    return NextResponse.json({ bundles });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch mock bundles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Create new bundle
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { title, description, mockIds, discountedPrice, status } = await req.json();

    if (!title || !mockIds?.length) {
      return NextResponse.json({ error: "Title and mockIds are required" }, { status: 400 });
    }

    // Fetch mocks to calculate basePrice
    const mocks = await prisma.mockTest.findMany({
      where: { id: { in: mockIds } },
    });

    if (!mocks.length) {
      return NextResponse.json({ error: "No valid mocks found" }, { status: 400 });
    }

    const basePrice = mocks.reduce((sum, mock) => sum + mock.price, 0);

    const bundle = await prisma.mockBundle.create({
      data: {
        title,
        description,
        mockIds,
        basePrice,
        discountedPrice,
        status: status ?? "DRAFT",
      },
    });

    return NextResponse.json({ bundle });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create bundle" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // Update bundle
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { id, title, description, mockIds, discountedPrice, status } = await req.json();

    if (!id) return NextResponse.json({ error: "Bundle ID is required" }, { status: 400 });

    const updateData: any = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (mockIds?.length) {
      const mocks = await prisma.mockTest.findMany({ where: { id: { in: mockIds } } });
      const basePrice = mocks.reduce((sum, mock) => sum + mock.price, 0);
      updateData.mockIds = mockIds;
      updateData.basePrice = basePrice;
    }
    if (discountedPrice !== undefined) updateData.discountedPrice = discountedPrice;
    if (status) updateData.status = status;

    const updatedBundle = await prisma.mockBundle.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ bundle: updatedBundle });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update bundle" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  // Delete bundle
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Bundle ID is required" }, { status: 400 });

    await prisma.mockBundle.delete({ where: { id } });

    return NextResponse.json({ message: "Bundle deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting mock bundle:", error);
    
    // Check if it's a role-based access error
    if (error instanceof Response) {
      const status = error.status;
      if (status === 403) {
        return NextResponse.json({ 
          error: "You don't have permission to delete mock bundles. Only admins can delete mock bundles." 
        }, { status: 403 });
      }
      if (status === 401) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    
    return NextResponse.json({ 
      error: error.message || "Failed to delete bundle" 
    }, { status: 500 });
  }
}
