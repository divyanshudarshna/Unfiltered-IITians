// app/courses/page.tsx
import CourseList from "@/components/CourseList";
import FAQPage from "@/components/faq";
import MockBundlesSection from "@/components/MockBundlesSection";
// import GuidanceSessionsList from "@/components/GuidanceSessionsList";
export const revalidate = 60;
import Link from "next/link";
export default function CoursesPage() {
  return (
    <div className="space-y-12">
      <CourseList 
        title="Master Your Skills with Our Courses"
        description="Structured learning programs designed to help you excel in competitive exams and build a strong foundation in biotechnology concepts."
        showSearch={true}
        fetchCourses={true}
        showViewAllButton={false}
      />

      {/* Add Mock Bundles below courses */}
      <section>
    
        <MockBundlesSection />
      </section>


      {/* <GuidanceSessionsList
      
            totalCardsCount={6}
         /> */}
          <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-[#6C2BD9]/10 to-[#8A4FFF]/10 border border-[#8A4FFF]/20 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl dark:text-white text-purple-800 font-bold mb-4">
              Need Personalized Guidance?
            </h2>
            <p className="dark:text-gray-300 text-black max-w-2xl mx-auto mb-8 text-lg">
              Book a one-on-one session with Divyanshu to get expert advice on
              exam preparation strategies, career guidance, and personalized
              study plans.
            </p>
            <Link
              href="/guidance"
              prefetch
              className="inline-flex items-center gap-3 bg-gradient-to-r from-[#6C2BD9] to-[#8A4FFF] text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-1"
            >
              Book a Guidance Session
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Now FAQ compoenent below */}

      <section>
        <FAQPage categories={["courses", "mocks"]} />

      </section>
    </div>



  );
}
