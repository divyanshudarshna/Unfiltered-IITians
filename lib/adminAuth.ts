import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function adminAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user || user.role !== "ADMIN") {
    throw new Response("Forbidden", { status: 403 });
  }

  return user;
}
