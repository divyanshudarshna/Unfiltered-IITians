// app/[username]/dashboard/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/dashboard/DashboardClient";

interface Props {
  params: { username: string };
}

export default async function StudentDashboard({ params }: Props) {
  const user = await currentUser();
  const decodedUsername = decodeURIComponent(params.username);

  // Redirect if not logged in or username mismatch
  if (!user || user.firstName !== decodedUsername) {
    redirect("/unauthorized");
  }

  // Fetch the DB user profile (includes subscriptions + other relations)
  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: user.id },
    include: {
      mockAttempts: { include: { mockTest: true } },
      enrollments: { include: { course: true } },
      subscriptions: true,
    },
  });

  if (!dbUser) {
    redirect("/unauthorized");
  }

  // Fetch active subscription with mockTest relation
 // Fetch all active subscriptions with their mockTest details
const subscriptions = await prisma.subscription.findMany({
  where: {
    userId: dbUser.id,
    paid: true, // ensure only paid ones are returned
  },
  include: {
    mockTest: true, // so we can show the title in the card
  },
  orderBy: {
    createdAt: "desc",
  },
});




  // Build safe user object for client component
  const safeUser = {
    id: user.id,
    firstName:user.firstName,
   fullName: `${user.firstName ?? ""} ${user.lastName ?? ""}`,
    email: user.emailAddresses[0]?.emailAddress ?? "",
    username: user.username ?? "",
    phoneNumber: user.phoneNumbers?.[0]?.phoneNumber ?? "",
    imageUrl: user.imageUrl ?? "",
    createdAt: user.createdAt,
  };
 console.log(safeUser);
  return (
    <DashboardClient
      safeUser={safeUser}
      initialProfile={dbUser}
      subscription={subscriptions}
    />
  );
}
