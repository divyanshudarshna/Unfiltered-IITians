import { CourseProvider } from "@/app/contexts/CourseContext"
import CourseDetailPageContent from "@/app/(course)/dashboard/courses/[id]/CourseDetailPageContent"
import { SidebarProvider } from "@/components/ui/sidebar"

export default async function CoursePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <SidebarProvider>
      <CourseProvider courseId={id} preview>
        <CourseDetailPageContent />
      </CourseProvider>
    </SidebarProvider>
  )
}
