// app/mockBundles/[bundleId]/mocks/page.tsx
import { prisma } from "@/lib/prisma";
import BundleMocksClient from "@/components/BundleMocksClient";

export default async function BundleMocksPage({
  params,
}: {
  params: Promise<{ bundleId: string }>;
}) {
  const { bundleId } = await params;

  // Fetch bundle
  const bundle = await prisma.mockBundle.findUnique({
    where: { id: bundleId },
  });

  if (!bundle) {
    return (
      <main className="p-6 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">❌ Bundle not found</h1>
          <p className="text-gray-500">The mock bundle you are looking for does not exist.</p>
        </div>
      </main>
    );
  }

  // Fetch mocks (only required fields)
  const mocks =
    bundle.mockIds.length > 0
      ? await prisma.mockTest.findMany({
          where: { id: { in: bundle.mockIds } },
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            questions: true,
            difficulty: true,
            tags: true,
          },
        })
      : [];

  // Simplify mocks for frontend
  const simplifiedMocks = mocks.map((mock) => ({
    id: mock.id,
    title: mock.title,
    description: mock.description,
    duration: mock.duration,
    questionCount: Array.isArray(mock.questions) ? mock.questions.length : 0,
    difficulty: mock.difficulty,
    tags: mock.tags,
  }));

  return (
    <main className="p-6 space-y-8">
      {/* Simple Hero Section */}
      <section className="text-center my-6">
        <h1 className="text-3xl md:text-4xl font-bold text-purple-600">
          {bundle.title}
        </h1>
        {bundle.description && (
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            {bundle.description}
          </p>
        )}
      </section>

      {/* Mocks Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Mocks in this Bundle</h2>
        {simplifiedMocks.length > 0 ? (
          <BundleMocksClient mocks={simplifiedMocks} />
        ) : (
          <p className="text-gray-500">No mocks available in this bundle yet.</p>
        )}
      </section>
    </main>
  );
}
