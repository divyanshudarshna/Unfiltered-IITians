// page.tsx (Server Component)
import { CourseProvider } from "@/app/contexts/CourseContext";
import CourseDetailPageContent from "./CourseDetailPageContent";

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const courseId = params.id;

  if (!courseId) return null;

  return (
    <CourseProvider courseId={courseId}>
      <CourseDetailPageContent />
    </CourseProvider>
  );
}
