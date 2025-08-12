import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import ClientMockList from "@/components/ClientMockList";

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
    orderBy: { createdAt: "desc" },
  });

  const userSubscriptions = await prisma.subscription.findMany({
    where: { userId: dbUser.id, paid: true },
    select: { mockTestId: true },
  });

  return (
    <main className="p-6 md:p-10 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-10">
          Mock Tests
        </h1>
        <ClientMockList
          mocks={mocks}
          userId={userId}
          purchasedMockIds={userSubscriptions.map((sub) => sub.mockTestId)}
        />
      </div>
    </main>
  );
}
