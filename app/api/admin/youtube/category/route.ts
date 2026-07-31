import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

// POST /api/admin/youtube/category
export async function POST(req: Request) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const body = await req.json();
    const { name, desc } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const category = await prisma.youtubeCategory.create({
      data: { name, desc },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to create category" }, { status: 500 });
  }
}

// GET /api/admin/youtube/category
export async function GET(req: Request) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const categories = await prisma.youtubeCategory.findMany({
      include: { videos: true },
    });

    return NextResponse.json(categories);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to load categories" }, { status: 500 });
  }
}
