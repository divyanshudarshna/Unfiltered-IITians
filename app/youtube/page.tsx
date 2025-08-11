// app/Youtube.tsx
"use client";
import { useEffect,useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { YoutubeIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Tilt from "react-parallax-tilt";
import { Typewriter } from "react-simple-typewriter";
const phdVideos = [
  {
    title: "Complete Guide For PhD",
    desc: "Step-by-step guide for strong applications",
    link: "https://www.youtube.com/embed/rd_brsbfLMY",
  },
  {
    title: "Computer Science Engineering PhD Interview",
    desc: "Common questions and how to answer them",
    link: "https://www.youtube.com/embed/DpS9s_GMA_c",
  },
  {
    title: "Psychology PhD Interview Preparation",
    desc: "How to approach your interview",
    link: "https://www.youtube.com/embed/1AjYQ8TFeyk",
  },
  {
    title: "Civil Engineering PhD Interview",
    desc: "What to expect in your research journey",
    link: "https://www.youtube.com/embed/Uwfsvsa46jc",
  },
  {
    title: "PhD Interview Preparation Guide",
    desc: "Essential tips to ace your interview",
    link: "https://www.youtube.com/embed/WK3eS1BuoFQ",
  },
  {
    title: "How to Crack Integrated PhD Interview",
    desc: "Special strategies for integrated programs",
    link: "https://www.youtube.com/embed/rHr5XfD6XsU",
  },
  {
    title: "Why Not to Choose Integrated PhD",
    desc: "Important considerations before deciding",
    link: "https://www.youtube.com/embed/yzNcGlZCuPo",
  },
  {
    title: "My IIT JAM to PhD Story",
    desc: "Personal journey and lessons learned",
    link: "https://www.youtube.com/embed/iWVXn7Rn15I",
  },
];

export default function YoutubePage() {
   const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Fix hydration error by delaying theme-dependent rendering until mounted
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <main className="px-4 md:px-12 py-10 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-6 mb-12">
        <h1 className="text-3xl sm:text-5xl font-bold text-foreground text-center">
          <Typewriter
            words={["Learn With Divyanshu"]}
            loop={false}
            cursor
            cursorStyle="_"
            typeSpeed={80}
            deleteSpeed={0}
            delaySpeed={1000}
          />
        </h1>

        <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
          Your gateway to mastering competitive exams, PhD preparation, and
          academic success through engaging video content
        </p>
        <Button size="lg" variant="default" className="rounded-xl">
          <YoutubeIcon className="mr-2 h-5 w-5" /> Subscribe Now
        </Button>
      </section>

      {/* PhD Preparation Section */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-600 text-white p-2 rounded-full">
            <YoutubeIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              PhD Preparation
            </h2>
            <p className="text-sm text-muted-foreground">
              From application to interview - Your complete guide to PhD
              admissions
            </p>
          </div>
        </div>

        {mounted && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {phdVideos.map((video, idx) => (
              <div
                key={idx}
                className={cn(
                  "rounded-xl border shadow-md p-2 overflow-hidden",
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-700"
                    : "bg-white border-zinc-200"
                )}
              >
                <div className="aspect-video overflow-hidden rounded-md">
                  <iframe
                    src={video.link}
                    loading="lazy"
                    allowFullScreen
                    className="w-full h-full rounded-md"
                  ></iframe>
                </div>
                <div className="mt-2 px-1">
                  <h3 className="font-medium text-foreground">{video.title}</h3>
                  <p className="text-xs text-muted-foreground">{video.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
