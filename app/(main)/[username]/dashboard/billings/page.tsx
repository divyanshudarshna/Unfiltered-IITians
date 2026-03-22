// app/(main)/[username]/dashboard/billings/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import BillingClient from "@/components/dashboard/BillingClient";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function BillingsPage({ params }: Props) {
  const user = await currentUser();
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  // Check if logged-in user matches the username in URL
  if (!user || user.firstName !== decodedUsername) {
    redirect("/unauthorized");
  }

  const safeUser = {
    id: user.id,
    firstName: user.firstName || "",
    fullName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
    email: user.emailAddresses[0]?.emailAddress ?? "",
    imageUrl: user.imageUrl ?? "",
  };

  return <BillingClient user={safeUser} />;
}
