// components/MockBundlesSection.tsx
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import MockBundlesList from "@/components/MockBundlesList";

export const revalidate = 60;

export default async function MockBundlesSection() {
  let clerkUserId: string | null = null;
  let userMockSubscriptions: string[] = [];
  let userBundleSubscriptions: string[] = [];

  try {
    const user = await currentUser();
    if (user?.id) {
      clerkUserId = user.id;

      const dbUser = await prisma.user.findUnique({
        where: { clerkUserId },
        include: { subscriptions: true },
      });

      if (dbUser?.subscriptions) {
        // Get individual mock subscriptions
        userMockSubscriptions = dbUser.subscriptions
          .filter(sub => sub.paid && sub.mockTestId)
          .map(sub => sub.mockTestId!);
        
        // Get bundle subscriptions
        userBundleSubscriptions = dbUser.subscriptions
          .filter(sub => sub.paid && sub.mockBundleId)
          .map(sub => sub.mockBundleId!);
      }
    }
  } catch (error) {
    console.warn("No logged-in user, continuing as guest:", error);
  }

  let bundles: any[] = [];
  let bundlesWithMockDetails: any[] = [];

  try {
    bundles = await prisma.mockBundle.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" }
      ],
    });

    // Fetch mock test details for all bundles
    bundlesWithMockDetails = await Promise.all(
      bundles.map(async (bundle) => {
        try {
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
        } catch (error) {
          console.error(`Error fetching mock tests for bundle ${bundle.id}:`, error);
          return {
            ...bundle,
            mockTests: []
          };
        }
      })
    );
  } catch (error) {
    console.error("Error fetching mock bundles:", error);
    bundlesWithMockDetails = [];
  }

  return (
    <MockBundlesList
      bundles={bundlesWithMockDetails}
      userMockSubscriptions={userMockSubscriptions}
      userBundleSubscriptions={userBundleSubscriptions}
      clerkUserId={clerkUserId}
    />
  );
}
