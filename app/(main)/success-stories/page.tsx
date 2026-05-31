// app/success-stories/page.tsx (Server Component)
import { prisma } from "@/lib/prisma";
import SuccessStoriesList from "@/components/SuccessStoriesList";

export const revalidate = 300; // ISR: refresh every 5 min

export default async function SuccessStoriesPage() {
  const allStories = await prisma.studentSuccessStory.findMany({
    orderBy: { createdAt: "desc" },
  });

  const stories = allStories.filter((story) => {
    const status = String((story as { approvalStatus?: string | null }).approvalStatus ?? "").toLowerCase();
    const isApproved = (story as { isApproved?: boolean | null }).isApproved;

    if (status === "pending" || status === "rejected") return false;
    if (status === "approved") return true;

    // Legacy fallback: if status is missing/unknown, only hide when explicitly marked unapproved.
    return isApproved !== false;
  });

  return <SuccessStoriesList stories={stories} />;
}
