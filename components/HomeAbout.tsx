"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Tilt from "react-parallax-tilt";
import Link from "next/link";

import { BookOpenCheck, GraduationCap, ArrowRight } from "lucide-react";
import { FaYoutube } from "react-icons/fa";

export const dynamic = "force-static";

const highlights = [
  {
    icon: <BookOpenCheck className="w-6 h-6" />,
    title: "About Me",
    content: (
      <>
        <p>
          I&apos;m <b>Divyanshu Darshna</b>, a passionate neuroscientist and
          biotechnology educator with roots at <b>IIT Bombay</b>, currently
          advancing research at <b>IIT Roorkee</b>.
        </p>
        <p className="mt-2">
          My mission is to demystify complex scientific concepts and provide
          students with the tools, strategies, and confidence needed to excel in
          competitive exams and research careers.
        </p>
      </>
    ),
    link: { href: "/about", text: "My Journey" },
    bg: "bg-slate-50 dark:bg-slate-900/30",
    border: "border-slate-200 dark:border-slate-700",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: "Student Success Stories",
    content: (
      <div className="space-y-3">
        <p>
          Divyanshu sir&apos;s guidance helped me crack IIT JAM with AIR 44. His
          teaching and guidance style makes even the most complex topics
          understandable. - <b>Krishna Samatia</b>
        </p>
        <p>
          The mentorship program transformed my approach to research. I&apos;m
          now pursuing my PhD at IIT Bombay. - <b>Anonymous</b>
        </p>
        <p>
          Divyanshu Sir&apos;s YouTube helped me crack my PhD interview at IIT
          Roorkee — His YouTube is invaluable. - <b>Research Scholar</b>
        </p>
      </div>
    ),
    link: { href: "/success-stories", text: "Read More Stories" },
    bg: "bg-slate-50 dark:bg-slate-900/30",
    border: "border-slate-200 dark:border-slate-700",
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
  },
  {
    icon: <BookOpenCheck className="w-6 h-6" />,
    title: "Comprehensive Courses",
    content: (
      <>
        <p>
          My meticulously designed courses cover the entire biotechnology
          spectrum, tailored specifically for:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>IIT JAM Biotechnology</li>
          <li>GAT-B &amp; GATE Exams</li>
          <li>University Entrance Tests</li>
          <li>Research Methodology</li>
        </ul>
      </>
    ),
    link: { href: "/courses", text: "View All Courses" },
    bg: "bg-slate-50 dark:bg-slate-900/30",
    border: "border-slate-200 dark:border-slate-700",
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: <FaYoutube className="w-6 h-6" />,
    title: "Free Learning Resources",
    content: (
      <>
        <p>
          Access my YouTube channel for free tutorials, exam strategies, and
          research insights that have helped thousands of students:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Concept Breakdown Videos</li>
          <li>Exam Preparation Guides</li>
          <li>Research Career Advice</li>
          <li>Live Q&amp;A Sessions</li>
        </ul>
      </>
    ),
    link: { href: "/youtube", text: "Visit YouTube" },
    bg: "bg-slate-50 dark:bg-slate-900/30",
    border: "border-slate-200 dark:border-slate-700",
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
  },
];

export default function HowICanHelp() {
  return (
    <section className="p-6 sm:px-10 lg:px-20">
      <div className="max-w-6xl mx-auto text-center">
        {/* Title */}
           <h2 className="text-4xl sm:text-6xl font-extrabold mb-3 bg-gradient-to-r from-purple-400 to-primary bg-clip-text text-transparent">
             How I Can Help You Succeed
           </h2>
        <p className="text-lg sm:text-lg text-gray-600 dark:text-gray-400 mb-12">
          Divyanshu Darshna | PhD Scholar, IIT Roorkee – Biotechnology
          Department
        </p>

        {/* Profile Image */}
        <div className="flex justify-center mb-12">
          <Tilt
            className="w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full overflow-hidden transition-transform duration-500 hover:scale-105"
            tiltMaxAngleX={25}
            tiltMaxAngleY={25}
            perspective={900}
            gyroscope={true}
          >
            <Image
              src="https://res.cloudinary.com/dqe1wy2nc/image/upload/v1758919081/admin-uploads/about-277c5b7e.webp"
              alt="Divyanshu Darshna"
              width={400}
              height={400}
              className="object-cover w-full h-full rounded-full border-4 border-purple-600/40"
              priority
            />
          </Tilt>
        </div>

     {/* Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
  {highlights.map((item, index) => (
    <Link
      key={index}
      href={item.link?.href || "#"}
      prefetch={true}
      className="group"
    >
      <Card
        className={
          `relative bg-muted/40 border border-transparent rounded-xl w-full mx-auto text-left group transition-all duration-500 min-h-[260px] h-full p-6 backdrop-blur-md ` +
          `hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] hover:border-primary `
        }
      >
        {/* Faded background layer for glass effect */}
        <div className="absolute inset-0 rounded-xl bg-muted/40 opacity-50 pointer-events-none z-0" />
        <CardHeader className="flex flex-col items-center justify-center text-center relative z-10">
          {/* Icon Centered + Bigger */}
          <div
            className={`w-20 h-20 rounded-full ${item.iconBg} ${item.iconColor} flex items-center justify-center`}
          >
            <div className="text-8xl">{item.icon}</div>
          </div>

          {/* Title Below Icon */}
          <CardTitle className="mt-4 text-2xl font-semibold font-heading text-black dark:text-white dark:group-hover:text-primary-foreground transition-colors duration-500">
            {item.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-10 text-left flex flex-col items-left">
          <div className="text-base sm:text-lg leading-relaxed space-y-3 text-muted-foreground dark:text-primary-foreground dark:group-hover:text-primary-foreground transition-colors duration-500">
            {item.content}
          </div>
          {item.link && (
            <div className="mt-5">
              <div
                className="inline-flex min-w-[140px] justify-center items-center px-5 py-2 rounded-2xl border border-purple-400 text-sm font-medium text-violet-700 dark:text-violet-500 group-hover:text-violet-900 dark:group-hover:text-violet-400 transition-colors p-4"
              >
                {item.link.text}
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  ))}
</div>


      </div>
    </section>
  );
}



// OLD CARD BACKUP CODE
//    {/* Highlights Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {highlights.map((item, index) => (
//             <Link
//               key={index}
//               href={item.link?.href || "#"}
//               prefetch={true}
//               className="group"
//             >
//               <Card
//                 className={`relative h-full transition-all duration-500 ${item.border} ${item.bg} backdrop-blur-sm 
//                   hover:scale-[1.02] hover:shadow-xl hover:border-transparent 
//                   before:absolute before:inset-0 before:rounded-2xl before:border-2 before:border-transparent 
//                   hover:before:border-violet-500 hover:before:shadow-[0_0_25px_5px_rgba(139,92,246,0.5)] before:transition-all before:duration-700`}
//               >
//                 <CardHeader className="flex flex-row items-center gap-4 relative z-10">
//                   <div
//                     className={`p-3 rounded-md ${item.iconBg} ${item.iconColor}`}
//                   >
//                     {item.icon}
//                   </div>
//                   <CardTitle className="text-2xl font-semibold font-heading text-slate-800 dark:text-slate-200">
//                     {item.title}
//                   </CardTitle>
//                 </CardHeader>

//                 <CardContent className="relative z-10">
//                   <div className="text-slate-700 dark:text-slate-300 font-body text-left text-base sm:text-lg leading-relaxed space-y-3">
//                     {item.content}
//                   </div>
//                   {item.link && (
//                     <div className="mt-5 flex justify-start">
//                       <div
//                         className="inline-flex items-center px-4 py-2 rounded-2xl border border-purple-400 text-sm font-medium text-violet-700 dark:text-violet-500 
//         group-hover:text-violet-900 dark:group-hover:text-violet-400 transition-colors"
//                       >
//                         {item.link.text}
//                         <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
//                       </div>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             </Link>
//           ))}
//         </div>
