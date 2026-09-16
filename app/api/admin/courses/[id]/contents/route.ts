// api/admin/courses/[id]/contents/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

interface Params {
  params: Promise<{ id: string }>;
}

// ➕ Create content for a course
export async function POST(req: Request, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { id } = await params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: "Invalid course ID format" }, { status: 400 });
    }

    const { title, description, order } = await req.json();

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (description !== undefined && description !== null && typeof description !== "string") {
      return NextResponse.json({ error: "Description must be text" }, { status: 400 });
    }
    if (!Number.isInteger(Number(order)) || Number(order) < 1) {
      return NextResponse.json({ error: "Order must be a positive whole number" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { id }, select: { id: true } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const content = await prisma.content.create({
      data: {
        title: title.trim(),
        description: typeof description === "string" ? description.trim() || null : null,
        order: Number(order),
        courseId: id,
      },
    });

    return NextResponse.json(content, { status: 201 });
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error("❌ Create Content Error:", err);
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 });
  }
}

// 📖 List contents of a course
export async function GET(req: Request, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { id } = await params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: "Invalid course ID format" }, { status: 400 });
    }
    const course = await prisma.course.findUnique({ where: { id }, select: { id: true } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    const contents = await prisma.content.findMany({
      where: { courseId: id },
      include: {
        lectures: true,
        quiz: true,
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(contents);
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error("❌ Get Contents Error:", err);
    return NextResponse.json({ error: "Failed to fetch contents" }, { status: 500 });
  }
}
