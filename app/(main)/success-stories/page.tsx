// app/success-stories/page.tsx (Server Component)
import { prisma } from "@/lib/prisma";
import SuccessStoriesList from "@/components/SuccessStoriesList";

export const revalidate = 300; // ISR: refresh every 5 min

export default async function SuccessStoriesPage() {
  const stories = await prisma.StudentSuccessStory.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <SuccessStoriesList stories={stories} />;
}
