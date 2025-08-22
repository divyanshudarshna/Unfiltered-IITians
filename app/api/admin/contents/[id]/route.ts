// app/api/admin/contents/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string }; // contentId
}

// ✅ Get single content
export async function GET(req: Request, { params }: Params) {
  try {
    const content = await prisma.content.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        courseId: true,
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    return NextResponse.json(content);
  } catch (err) {
    console.error("❌ Get Content Error:", err);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}

// ✏️ Update content
export async function PUT(req: Request, { params }: Params) {
  try {
    const { title, description, order } = await req.json();

    const updated = await prisma.content.update({
      where: { id: params.id },
      data: { title, description, order },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("❌ Update Content Error:", err);
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
  }
}

// ❌ Delete content
export async function DELETE(req: Request, { params }: Params) {
  try {
    await prisma.content.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Delete Content Error:", err);
    return NextResponse.json({ error: "Failed to delete content" }, { status: 500 });
  }
}