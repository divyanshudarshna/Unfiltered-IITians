// MockBundlesPage.tsx (Server Component)
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import MockBundlesList from "@/components/MockBundlesList";

export const revalidate = 60; // ISR cache: refresh every 60s

export default async function MockBundlesPage() {
  let clerkUserId: string | null = null;
  let userMockSubscriptions: string[] = [];

  try {
    // Try fetching the current user (optional)
    const user = await currentUser();
    if (user?.id) {
      clerkUserId = user.id;

      // Fetch user's subscriptions safely
      const dbUser = await prisma.user.findUnique({
        where: { clerkUserId },
        include: { subscriptions: true },
      });

      if (dbUser?.subscriptions) {
        userMockSubscriptions = dbUser.subscriptions
          .filter(sub => sub.paid && sub.mockTestId)
          .map(sub => sub.mockTestId!);
      }
    }
  } catch (err) {
    console.warn("No logged-in user, continuing as guest.");
    // Login not required, continue as guest
  }

  // Fetch published bundles
  const bundles = await prisma.mockBundle.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
  });
  
  

  return (
    <MockBundlesList
      bundles={bundles}
      userMockSubscriptions={userMockSubscriptions}
      clerkUserId={clerkUserId}
    />
  );
}
