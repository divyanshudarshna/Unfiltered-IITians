import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import ClientMockList from "@/components/ClientMockList";
import FAQPage from "@/components/faq";
export const revalidate = 60 // ✅ re-generate this page every 60s
export default async function MockListPage() {
  const { userId } = await auth();

  if (!userId) {
    return <p className="text-center mt-10">Please sign in to view mocks.</p>;
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!dbUser) {
    return <p className="text-center mt-10">User profile not found.</p>;
  }

  const mocks = await prisma.mockTest.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      actualPrice: true,
      duration: true,
      questions: true,
      tags: true,
      difficulty: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const mockBundles = await prisma.mockBundle.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [
      { order: "asc" },
      { createdAt: "desc" }
    ],
    select: {
      id: true,
      title: true,
      description: true,
      mockIds: true,
      basePrice: true,
      discountedPrice: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Fetch mock test details for all bundles
  const bundlesWithMockDetails = await Promise.all(
    mockBundles.map(async (bundle) => {
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

  const userSubscriptions = await prisma.subscription.findMany({
    where: { userId: dbUser.id, paid: true },
    select: { mockTestId: true, mockBundleId: true },
  });

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-black transition-colors duration-500">
      <main className="p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto mb-12 relative">
            {/* Main heading with gradient text */}
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-amber-600 via-purple-600 to-amber-500 bg-clip-text text-transparent relative z-10">
              Mock Tests
              <div className="h-1 w-24 bg-gradient-to-r from-amber-500 to-purple-500 mx-auto mt-4 rounded-full"></div>
            </h1>

            {/* Eyecatchy note */}
            <div className="bg-gradient-to-r from-amber-500/10 to-purple-600/10 border border-amber-500/20 rounded-lg p-4 text-center max-w-2xl mx-auto">
              <p className="text-amber-700 dark:text-amber-300 font-medium">
                🚀 Boost your exam preparation with our premium mock tests - featuring detailed solutions, performance analytics, and real exam simulation!
              </p>
            </div>
          </div>

          <ClientMockList
            mocks={mocks}
            bundles={bundlesWithMockDetails}
            userId={userId}
            purchasedMockIds={userSubscriptions.map((sub) => sub.mockTestId).filter((id): id is string => id !== null)}
            purchasedBundleIds={userSubscriptions.map((sub) => sub.mockBundleId).filter((id): id is string => id !== null)}
          />

          <FAQPage categories={["mocks"]}/>
        </div>
      </main>
    </div>
  );
}
