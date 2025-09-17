'use client';

import Hero from "@/components/Hero";
import HomeAbout from "@/components/HomeAbout";
import Testimonials from "@/components/Testimonials";
import FAQPage from "@/components/faq";

export default function Home() {

  return (
    <>
    <Hero/>
    {/* <CourseList showSearch={false}
    
  description="Handpicked selection of our best courses for professional growth"
  countShow={3}
    /> */}
    <FAQPage categories={[ "getting started","courses"]} />
    <HomeAbout/>

    <Testimonials/>

    
    </>
  );
}
