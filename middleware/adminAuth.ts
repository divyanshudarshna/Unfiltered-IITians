import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function adminAuth() {
  const user = await currentUser();

  if (!user) throw new Response("Unauthorized", { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: user.id },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    throw new Response("Forbidden", { status: 403 });
  }

  return dbUser;
}
