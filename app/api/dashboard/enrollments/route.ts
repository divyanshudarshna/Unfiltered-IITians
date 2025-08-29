// app/api/dashboard/enrollments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const clerkUserId = url.searchParams.get("userId");

    if (!clerkUserId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1️⃣ Map Clerk userId → internal Mongo ObjectId
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2️⃣ Fetch enrollments using user.id (Mongo ObjectId)
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id }, // Mongo ObjectId
      include: { course: true },
    });

    // 3️⃣ Map courses to frontend-friendly format
    const courses = enrollments.map((e) => ({
      id: e.course.id,
      title: e.course.title,
      description: e.course.description,
      price: e.course.price,
      actualPrice: e.course.actualPrice,
    }));

    return NextResponse.json(courses);
  } catch (err) {
    console.error("❌ Failed to fetch enrollments:", err);
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 });
  }
}
