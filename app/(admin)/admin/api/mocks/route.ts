// app/(admin)/api/mocks/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mocks = await prisma.mockTest.findMany({
    include: {
      _count: {
        select: { attempts: true, subscriptions: true },
      },
    },
  });

  return NextResponse.json(mocks);
}

export async function POST(request: Request) {
  const { userId } = auth();
  const data = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newMock = await prisma.mockTest.create({
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      questions: data.questions,
      tags: data.tags,
      difficulty: data.difficulty,
    },
  });

  return NextResponse.json(newMock);
}

export async function DELETE(request: Request) {
  const { userId } = auth();
  const { id } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.mockTest.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}