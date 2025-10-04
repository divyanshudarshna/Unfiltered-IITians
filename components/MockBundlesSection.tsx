// components/MockBundlesSection.tsx
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import MockBundlesList from "@/components/MockBundlesList";

export const revalidate = 60;

export default async function MockBundlesSection() {
  let clerkUserId: string | null = null;
  let userMockSubscriptions: string[] = [];

  try {
    const user = await currentUser();
    if (user?.id) {
      clerkUserId = user.id;

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
  } catch (error) {
    console.warn("No logged-in user, continuing as guest:", error);
  }

  const bundles = await prisma.mockBundle.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
  });

  // Fetch mock test details for all bundles
  const bundlesWithMockDetails = await Promise.all(
    bundles.map(async (bundle) => {
      const mockTests = await prisma.mockTest.findMany({
        where: {
          id: { in: bundle.mockIds },
          status: "PUBLISHED"
        },
        select: {
          id: true,
          title: true,
          difficulty: true,
          duration: true,
          tags: true
        }
      });

      return {
        ...bundle,
        mockTests
      };
    })
  );

  return (
    <MockBundlesList
      bundles={bundlesWithMockDetails}
      userMockSubscriptions={userMockSubscriptions}
      clerkUserId={clerkUserId}
    />
  );
}
