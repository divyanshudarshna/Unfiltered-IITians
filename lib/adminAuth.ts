import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { AuthError } from "./roleAuth";

export async function adminAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw new AuthError("Unauthorized", 401);
  }

  let user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  // No DB record — webhook likely missed. Auto-sync from Clerk.
  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new AuthError("Unauthorized", 401);

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null;
    const role = (clerkUser.publicMetadata?.role as 'ADMIN' | 'INSTRUCTOR' | 'STUDENT') || 'STUDENT';

    user = await prisma.user.upsert({
      where: { clerkUserId: userId },
      create: { clerkUserId: userId, email, name, profileImageUrl: clerkUser.imageUrl, role },
      update: { email, name, profileImageUrl: clerkUser.imageUrl },
    });
    console.log(`[adminAuth] Auto-synced user ${email} with role ${user.role}`);
  }

  if (user.role !== "ADMIN") {
    throw new AuthError("Forbidden", 403);
  }

  return user;
}
