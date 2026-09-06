// components/MockBundlesSection.tsx
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import MockBundlesList from "@/components/MockBundlesList";

export const revalidate = 60;

type BundleWithMockDetails = {
  id: string;
  title: string;
  description: string | null;
  mockIds: string[];
  basePrice: number;
  discountedPrice: number | null;
  createdAt: Date;
  status: string;
  mockTests: Array<{
    id: string;
    title: string;
    difficulty: string;
    duration: number | null;
    tags: string[];
  }>;
};

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

      if (dbUser) {
        // Get individual mock subscriptions
        userMockSubscriptions = dbUser.subscriptions
          .filter(sub => sub.paid && sub.mockTestId)
          .map(sub => sub.mockTestId!);
        
        // Get bundle subscriptions
        userBundleSubscriptions = dbUser.subscriptions
          .filter(sub => sub.paid && sub.mockBundleId)
          .map(sub => sub.mockBundleId!);

        const now = new Date();
        const entitlements = await prisma.entitlement.findMany({
          where: {
            userId: dbUser.id,
            resourceType: { in: ["MOCK_TEST", "MOCK_BUNDLE"] },
            status: "ACTIVE",
            startsAt: { lte: now },
            OR: [{ endsAt: null }, { endsAt: { gt: now } }],
          },
          select: { resourceType: true, resourceId: true },
        });
        userMockSubscriptions = [...new Set([
          ...userMockSubscriptions,
          ...entitlements
            .filter((entitlement) => entitlement.resourceType === "MOCK_TEST")
            .map((entitlement) => entitlement.resourceId),
        ])];
        userBundleSubscriptions = [...new Set([
          ...userBundleSubscriptions,
          ...entitlements
            .filter((entitlement) => entitlement.resourceType === "MOCK_BUNDLE")
            .map((entitlement) => entitlement.resourceId),
        ])];
      }
    }
  } catch {
    // console.warn("No logged-in user, continuing as guest:", error);
  }

  let bundlesWithMockDetails: BundleWithMockDetails[] = [];

  try {
    const bundles = await prisma.mockBundle.findMany({
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
        } catch {
          // console.error(`Error fetching mock tests for bundle ${bundle.id}:`, error);
          return {
            ...bundle,
            mockTests: []
          };
        }
      })
    );
  } catch {
    // console.error("Error fetching mock bundles:", error);
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
