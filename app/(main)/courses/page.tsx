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

      {/* 7-Day Money-Back Guarantee */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-500/30 rounded-2xl p-8 md:p-10 shadow-lg">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              {/* Shield Icon */}
              <div className="flex-shrink-0">
                <div className="bg-green-500/20 p-4 rounded-full">
                  <svg
                    className="w-12 h-12 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
              </div>
              
              {/* Text Content */}
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-400 mb-2">
                  7-Day Money Back Guarantee
                </h3>
                <p className="text-lg text-green-800 dark:text-green-300">
                  Not satisfied? Get a <span className="font-semibold">full refund</span> — no questions asked.
                </p>
              </div>

              {/* Checkmark Icon */}
              <div className="flex-shrink-0">
                <svg
                  className="w-10 h-10 text-green-600 dark:text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

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
