import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

// GET a single course detail
export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = params;

    const detail = await prisma.courseDetail.findUnique({
      where: { id },
    });

    if (!detail) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error("❌ Failed to fetch module:", error);
    return NextResponse.json({ error: "Failed to fetch module" }, { status: 500 });
  }
}

// UPDATE a single course detail
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await req.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const updatedDetail = await prisma.courseDetail.update({
      where: { id },
      data: { title, description },
    });

    return NextResponse.json(updatedDetail);
  } catch (error) {
    console.error("❌ Failed to update module:", error);
    return NextResponse.json({ error: "Failed to update module" }, { status: 500 });
  }
}

// DELETE a single course detail
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id } = params;

    await prisma.courseDetail.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Module deleted successfully" });
  } catch (error) {
    console.error("❌ Failed to delete module:", error);
    return NextResponse.json({ error: "Failed to delete module" }, { status: 500 });
  }
}
