// app/courses/page.tsx
import CourseList from "@/components/CourseList";
import FAQPage from "@/components/faq";
import MockBundlesSection from "@/components/MockBundlesSection";
import GuidanceSessionsList from "@/components/GuidanceSessionsList";
export const revalidate = 60;

export default function CoursesPage() {
  return (
    <div className="space-y-12">
      <CourseList 
        title="Master Your Skills with Our Courses"
        description="Discover comprehensive courses designed by industry experts to boost your career"
        showSearch={true}
        fetchCourses={true}
        showViewAllButton={false}
      />

      {/* Add Mock Bundles below courses */}
      <section>
    
        <MockBundlesSection />
      </section>


      <GuidanceSessionsList
      
            totalCardsCount={6}
         />

      {/* Now FAQ compoenent below */}

      <section>
        <FAQPage categories={["courses", "mocks"]} />

      </section>
    </div>



  );
}
