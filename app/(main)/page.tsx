'use client';

import Hero from "@/components/Hero";
import HomeAbout from "@/components/HomeAbout";
import Testimonials from "@/components/Testimonials";
import FAQPage from "@/components/faq";
import Link from "next/link";
export default function Home() {

  return (
    <>
    <Hero/>
    {/* <CourseList sho   wSearc   h={false}
    
  description="Handpicked selection of our best courses for professional growth"
  countShow={3}
    /> */}
    <HomeAbout/>

    <Testimonials/>
    {/* <FAQPage categories={[ "getting started","courses"]} /> */}
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

    
    </>
  );
}
