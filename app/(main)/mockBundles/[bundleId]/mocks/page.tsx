// app/mockBundles/[bundleId]/mocks/page.tsx
import { prisma } from "@/lib/prisma";
import BundleMocksClient from "@/components/BundleMocksClient";
import { auth } from "@clerk/nextjs/server";
import BundlePurchaseSection from "@/components/BundlePurchaseSection";
import { ScrollToButton } from "@/components/ScrollToButton";
import { redirect } from "next/navigation";

export default async function BundleMocksPage({ params }: Readonly<{ params: { bundleId: string } }>) {
  const { bundleId } = params;
  const { userId } = await auth();

  if (!userId) {
    // Redirect to sign-in with the current page as return URL
    const returnUrl = encodeURIComponent(`/mockBundles/${bundleId}/mocks`);
    redirect(`/sign-in?redirectUrl=${returnUrl}`);
  }

  // Fetch bundle with pricing information
  const bundle = await prisma.mockBundle.findUnique({
    where: { id: bundleId },
    select: {
      id: true,
      title: true,
      description: true,
      mockIds: true,
      basePrice: true,
      discountedPrice: true,
      status: true,
    }
  });

  if (!bundle || bundle.status !== "PUBLISHED") {
    return (
      <div className="text-center mt-10">
        <h1 className="text-2xl font-bold mb-2">❌ Bundle not found</h1>
        <p className="text-gray-500">The mock bundle you are looking for does not exist.</p>
      </div>
    );
  }

  // Check if user has purchased this bundle
  const userSubscription = await prisma.subscription.findFirst({
    where: {
      user: { clerkUserId: userId },
      mockBundleId: bundleId,
      paid: true,
    },
  });

  // Get individual mock subscriptions for this user
  const userMockSubscriptions = await prisma.subscription.findMany({
    where: {
      user: { clerkUserId: userId },
      mockTestId: { in: bundle.mockIds },
      paid: true,
    },
    select: { mockTestId: true }
  });

  const purchasedMockIds = userMockSubscriptions.map(sub => sub.mockTestId!);
  const isBundlePurchased = !!userSubscription;
  
  // Check if user owns all mocks individually
  const ownsAllMocksIndividually = bundle.mockIds.length > 0 && 
    bundle.mockIds.every(mockId => purchasedMockIds.includes(mockId));
  
  const isPurchased = isBundlePurchased || ownsAllMocksIndividually;

  // Fetch mocks
  const mocks =
    bundle.mockIds.length > 0
      ? await prisma.mockTest.findMany({
          where: { 
            id: { in: bundle.mockIds },
            status: "PUBLISHED"
          },
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            price: true,
            actualPrice: true,
            questions: true,
            difficulty: true,
            tags: true,
          },
        })
      : [];
  const simplifiedMocks = mocks.map((m) => {
    const isSubscribed = isPurchased || purchasedMockIds.includes(m.id);
    let subscriptionSource: 'bundle' | 'individual' | 'none';
    
    if (isPurchased) {
      subscriptionSource = isBundlePurchased ? 'bundle' : 'individual';
    } else if (purchasedMockIds.includes(m.id)) {
      subscriptionSource = 'individual';
    } else {
      subscriptionSource = 'none';
    }

    return {
      ...m,
      actualPrice: m.actualPrice ?? undefined,
      description: m.description ?? undefined,
      duration: m.duration ?? 0,
      questions: Array.isArray(m.questions) ? m.questions : [],
      questionCount: Array.isArray(m.questions) ? m.questions.length : 0,
      isSubscribed,
      subscriptionSource,
      price: m.price
    };
  });

  // Calculate discount percentage
  const discountPercentage = bundle.discountedPrice && bundle.basePrice > bundle.discountedPrice
    ? Math.round(((bundle.basePrice - bundle.discountedPrice) / bundle.basePrice) * 100)
    : 0;

  const finalPrice = bundle.discountedPrice ?? bundle.basePrice;

  return (
    <main className="p-6 space-y-10">
      {/* Bundle Header */}
      <section className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl mt-8 font-bold text-purple-600">{bundle.title}</h1>
        {bundle.description && (
          <p className="mt-2 text-gray-600 dark:text-gray-400">{bundle.description}</p>
        )}
        
        {/* Bundle Stats */}
        <div className="flex justify-center items-center gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span>{bundle.mockIds.length} Mock Tests</span>
          </div>
          {isPurchased && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{ownsAllMocksIndividually ? 'Owned Individually' : 'Bundle Purchased'}</span>
            </div>
          )}
        </div>

        {/* Quick Action Button for Non-Purchased */}
        {!isPurchased && simplifiedMocks.length > 0 && (
          <ScrollToButton discountPercentage={discountPercentage} />
        )}
      </section>

      {/* Individual Mocks */}
      <section>
        {simplifiedMocks.length > 0 ? (
          <BundleMocksClient
            mocks={simplifiedMocks}
            clerkUserId={userId}
          />
        ) : (
          <p className="text-gray-500 text-center">No mocks available in this bundle yet.</p>
        )}
      </section>

      {/* Bundle Checkout/Purchase Section */}
      {simplifiedMocks.length > 0 && (
        <section id="purchase-section">
          <BundlePurchaseSection
            clerkUserId={userId}
            bundleId={bundle.id}
            bundleTitle={bundle.title}
            finalPrice={finalPrice}
            mockIds={bundle.mockIds}
            basePrice={bundle.basePrice}
            discountPercentage={discountPercentage}
            isPurchased={isPurchased}
            mockCount={bundle.mockIds.length}
            purchasedMockIds={purchasedMockIds}
            ownsAllIndividually={ownsAllMocksIndividually}
          />
        </section>
      )}
    </main>
  );
}
