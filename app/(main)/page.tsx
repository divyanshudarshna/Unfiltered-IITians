'use client';

import Hero from "@/components/Hero";
import HomeAbout from "@/components/HomeAbout";
import Testimonials from "@/components/Testimonials";
import FAQPage from "./faq/page";

export default function Home() {

  return (
    <>
    <Hero/>
    <FAQPage/>
    <HomeAbout/>

    <Testimonials/>

    
    </>
  );
}
