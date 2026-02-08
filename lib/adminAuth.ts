import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { AuthError } from "./roleAuth";

export async function adminAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw new AuthError("Unauthorized", 401);
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user || user.role !== "ADMIN") {
    throw new AuthError("Forbidden", 403);
  }

  return user;
}
