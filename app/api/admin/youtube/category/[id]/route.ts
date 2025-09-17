import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

// GET One Category
export async function GET(req: Request, { params }: Params) {
  try {
    const category = await prisma.youtubeCategory.findUnique({
      where: { id: params.id },
      include: { videos: true },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// UPDATE Category
export async function PUT(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const { name, desc } = body;

    const category = await prisma.youtubeCategory.update({
      where: { id: params.id },
      data: { name, desc },
    });

    return NextResponse.json(category);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE Category
export async function DELETE(req: Request, { params }: Params) {
  try {
    await prisma.youtubeCategory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Category deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
