// app/(admin)/api/users/route.ts
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

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isSubscribed: true,
      createdAt: true,
    },
  });

  return NextResponse.json(users);
}

export async function PATCH(request: Request) {
  const { userId } = auth();
  const { id, role } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const adminUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!adminUser || adminUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role },
  });

  return NextResponse.json(updatedUser);
}