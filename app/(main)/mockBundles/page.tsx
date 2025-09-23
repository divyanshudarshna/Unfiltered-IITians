// MockBundlesPage.tsx (Server Component)
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import MockBundlesList from "@/components/MockBundlesList";

export default async function MockBundlesPage() {
  const user = await currentUser();
  const clerkUserId = user?.id;

  // Fetch published bundles
  const bundles = await prisma.mockBundle.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
  });

  // Fetch user's subscriptions safely
  let userMockSubscriptions: string[] = [];
  if (clerkUserId) {
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

  return (
    <MockBundlesList
      bundles={bundles}
      userMockSubscriptions={userMockSubscriptions}
      clerkUserId={clerkUserId}
    />
  );
}
