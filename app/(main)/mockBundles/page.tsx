// app/mock-bundles/page.tsx (or wherever it is)
import MockBundlesSection from "@/components/MockBundlesSection";

export const revalidate = 60;

export default function MockBundlesPage() {
  return <MockBundlesSection />;
}
