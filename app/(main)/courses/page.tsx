// app/courses/page.tsx
import CourseList from "@/components/CourseListUpdated";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Link from "next/link";
export const revalidate = 60;
const faqItems = [
  {
    question: "How long do I have access to the course materials?",
    answer:
      "You will have access to all course materials for 6 months (or in offer period for one year) from the date of enrollment. This includes all video lectures, reference pdfs, practice questions, and mock tests. You can also download certain materials for offline use.",
  },
  {
    question: "Are the mock tests timed like the actual exams?",
    answer:
      "Yes, all our mock tests are designed to simulate the actual exam environment. They are timed according to the official exam pattern and provide detailed performance analytics to help you identify your strengths and weaknesses.",
  },
  {
    question: "Can I get personalized doubt clearing sessions?",
    answer:
      "Yes, we offer personalized doubt clearing sessions for students enrolled in our comprehensive courses. These sessions are conducted weekly and you can schedule them based on your convenience.",
  },
  {
    question: "What if I'm not satisfied with the course?",
    answer:
      "We offer a 7-day money-back guarantee for all our courses. If you're not satisfied with the quality of the content, you can request a full refund within 7 days of enrollment (provided less than 15% of the materials—including downloadable content, mock tests, lectures, and other resources—have been accessed, if it exceeds 15% - a refund will be issued after deducting 20% of the paid course price).",
  },
  {
    question: "Are the practice materials updated according to the latest syllabus?",
    answer:
      "Yes, all our course content and practice materials are regularly updated to align with the latest exam patterns and syllabi. We monitor any changes in the examination patterns and update our content accordingly.",
  },
]
export default function CoursesPage() {
  
  return (
    <div className="min-h-screen  text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 px-4 flex flex-col justify-center min-h-[60vh]">
        <div className="absolute inset-0 "></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center bg-[#0D0D15]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Comprehensive Biotechnology Courses
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Structured learning programs designed to help you excel in competitive exams and build a strong foundation in biotechnology concepts.
          </p>
          <a 
            href="#courses" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6C2BD9] to-[#8A4FFF] text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1"
          >
            Explore Courses 
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </section>

      {/* Dynamic Course Cards Section */}
      <section id="courses" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 inline-block relative">
              Exam Preparation Courses
              <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-[#6C2BD9] to-[#8A4FFF] rounded-full mt-4"></span>
            </h2>
          </div>
          
          {/* Dynamic Course List */}
          <CourseList 
            title=""
            description=""
            showSearch={false}
            fetchCourses={true}
            showViewAllButton={false}
          />
        </div>
      </section>

      {/* Practice Materials Section */}
 <section className="py-16 px-4">
  <div className="max-w-7xl mx-auto">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 inline-block relative">
        Practice Materials & Mock Tests
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-[#6C2BD9] to-[#8A4FFF] rounded-full mt-4"></span>
      </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Free Mock Test */}
      <div className="bg-[#151522]/50 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 flex flex-col h-full min-h-[420px]">
        <div className="flex-grow">
          <div className="text-5xl text-white mb-4">⭐</div>
          <h3 className="text-xl font-bold mb-3">Free Mock Test</h3>
          <p className="text-gray-400 mb-6">Take a free mock test to assess your current preparation level and identify areas that need improvement.</p>
          <div className="text-2xl font-bold text-white mb-6">FREE</div>
        </div>
        <Link
          href="/mocks"
          prefetch
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00ff8c] to-[#00cc6f] text-[#0D0D15] px-6 py-3 rounded-full font-semibold w-full justify-center hover:shadow-lg hover:shadow-green-500/30 transition-all mt-auto"
        >
          Take Free Test
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>

      {/* Mock Test Bundle 1 */}
      <div className="bg-[#151522]/50 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 flex flex-col h-full min-h-[420px]">
        <div className="flex-grow">
          <div className="text-5xl text-white mb-4">📄</div>
          <h3 className="text-xl font-bold mb-3">10 Mock Tests Bundle</h3>
          <p className="text-gray-400 mb-6">Comprehensive set of 10 full-length mock tests designed to simulate actual exam conditions with detailed solutions.</p>
          <div className="text-2xl font-bold text-white mb-2">₹899</div>
          <div className="text-gray-400 text-sm line-through mb-6">₹1499</div>
        </div>
        <a 
          href="/mockBundles" 
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6C2BD9] to-[#8A4FFF] text-white px-6 py-3 rounded-full font-semibold w-full justify-center hover:shadow-lg hover:shadow-purple-500/30 transition-all mt-auto"
        >
          Purchase Now 
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </a>
      </div>

      {/* Mock Test Bundle 2 */}
      <div className="bg-[#151522]/50 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 flex flex-col h-full min-h-[420px]">
        <div className="flex-grow">
          <div className="text-5xl text-white mb-4">📄</div>
          <h3 className="text-xl font-bold mb-3">5 Mock Tests Bundle</h3>
          <p className="text-gray-400 mb-6">Set of 5 full-length mock tests with detailed solutions and performance analysis.</p>
          <div className="text-2xl font-bold text-white mb-2">₹499</div>
          <div className="text-gray-400 text-sm line-through mb-6">₹750</div>
        </div>
        <a 
          href="/mockBundles" 
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6C2BD9] to-[#8A4FFF] text-white px-6 py-3 rounded-full font-semibold w-full justify-center hover:shadow-lg hover:shadow-purple-500/30 transition-all mt-auto"
        >
          Purchase Now 
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </a>
      </div>

      {/* Previous Year Papers */}
      <div className="bg-[#151522]/50 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 flex flex-col h-full min-h-[420px]">
        <div className="flex-grow">
          <div className="text-5xl text-white mb-4">📋</div>
          <h3 className="text-xl font-bold mb-3">Previous Year Papers</h3>
          <p className="text-gray-400 mb-6">Solved papers from the last 10 years with detailed explanations and alternative solving approaches.</p>
        </div>

       <Link
      href="/resources"
      className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6C2BD9] to-[#8A4FFF] text-white px-6 py-3 rounded-full font-semibold w-full justify-center hover:shadow-lg hover:shadow-purple-500/30 transition-all mt-auto"
    >
      Download Now
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </Link>
      </div>

      {/* Revision Notes */}
      <div className="bg-[#151522]/50 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 flex flex-col h-full min-h-[420px]">
        <div className="flex-grow">
          <div className="text-5xl text-white mb-4">📝</div>
          <h3 className="text-xl font-bold mb-3">Quick Revision Notes</h3>
          <p className="text-gray-400 mb-6">Concise, well-organized notes covering all high-yield topics for last-minute revision before exams.</p>
          <div className="text-2xl font-bold text-white mb-2">₹999</div>
          <div className="text-gray-400 text-sm line-through mb-6">₹3499</div>
        </div>

    <Link
      href="/resources"
      className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6C2BD9] to-[#8A4FFF] text-white px-6 py-3 rounded-full font-semibold w-full justify-center hover:shadow-lg hover:shadow-purple-500/30 transition-all mt-auto"
    >
      Purchase Now
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    </Link>
      </div>

      {/* Unit-wise Questions */}
      <div className="bg-[#151522]/50 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 flex flex-col h-full min-h-[420px]">
        <div className="flex-grow">
          <div className="text-5xl text-white mb-4">📖</div>
          <h3 className="text-xl font-bold mb-3">Unit-wise Question Banks</h3>
          <p className="text-gray-400 mb-6">Chapter-specific practice questions with varying difficulty levels to strengthen your understanding of each topic.</p>
          <div className="text-2xl font-bold text-white mb-6">₹999</div>
        </div>
      <Link
      href="/resources"
      className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6C2BD9] to-[#8A4FFF] text-white px-6 py-3 rounded-full font-semibold w-full justify-center hover:shadow-lg hover:shadow-purple-500/30 transition-all mt-auto"
    >
      Purchase Now
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    </Link>
      </div>
    </div>
  </div>
</section>
      {/* Guidance Session Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-[#6C2BD9]/10 to-[#8A4FFF]/10 border border-[#8A4FFF]/20 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Need Personalized Guidance?</h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8 text-lg">
              Book a one-on-one session with Divyanshu to get expert advice on exam preparation strategies, career guidance, and personalized study plans.
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

      {/* FAQ Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
    <h2 className="text-4xl md:text-6xl font-bold inline-block relative text-slate-900 dark:text-slate-100">
      Frequently Asked Questions
      <div className="absolute bottom-[-14px] left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
    </h2>
  </div>

  <Accordion
    type="single"
    collapsible
    className="space-y-6 max-w-6xl mx-auto w-full"
  >
    {faqItems.map((faq, index) => (
      <AccordionItem
        key={index}
        value={`faq-${index}`}
        className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl shadow-md transition-all"
      >
        <AccordionTrigger className="hover:bg-purple-500/10 px-8 py-6 text-xl font-semibold text-left text-slate-800 dark:text-slate-200 hover:no-underline transition-colors">
          {faq.question}
        </AccordionTrigger>
        <AccordionContent className="px-8 pb-6 text-lg">
          <p className="text-slate-700 dark:text-gray-300 leading-relaxed">
            {faq.answer}
          </p>
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
</section>


    </div>
  );
}