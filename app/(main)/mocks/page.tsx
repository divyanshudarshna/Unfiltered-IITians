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
       <div className="max-w-4xl mx-auto mb-12 relative">
  {/* Main heading with gradient text */}
  <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-amber-600 via-purple-600 to-amber-500 bg-clip-text text-transparent relative z-10">
    Mock Tests
    {/* Animated underline */}
    <div className="h-1 w-24 bg-gradient-to-r from-amber-500 to-purple-500 mx-auto mt-4 rounded-full"></div>
  </h1>
  
  {/* Eyecatchy note */}
  <div className="bg-gradient-to-r from-amber-500/10 to-purple-600/10 border border-amber-500/20 rounded-lg p-4 text-center max-w-2xl mx-auto">
    <p className="text-amber-700 dark:text-amber-300 font-medium">
      🚀 Boost your exam preparation with our premium mock tests - featuring detailed solutions, performance analytics, and real exam simulation!
    </p>
  </div>
  
  {/* Decorative elements */}
  <div className="absolute -top-4 -left-10 w-24 h-24 bg-amber-400/20 rounded-full blur-xl -z-10"></div>
  <div className="absolute -bottom-4 -right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-xl -z-10"></div>
  
 

</div>
        <ClientMockList
          mocks={mocks}
          userId={userId}
          purchasedMockIds={userSubscriptions.map((sub) => sub.mockTestId)}
        />
      </div>
    </main>
  );
}
