"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { FaYoutube } from "react-icons/fa";
import { useTheme } from "next-themes";
import { Typewriter } from "react-simple-typewriter";

interface Video {
  id: string;
  title: string;
  description: string;
  link: string;
}

interface Category {
  id: string;
  name: string;
  desc?: string;
  videos: Video[];
}

// A few distinct colors for category icons
const categoryColors = ["bg-purple-600", "bg-red-600", "bg-green-600", "bg-blue-600", "bg-orange-500"];

export default function YoutubePage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [animationDone, setAnimationDone] = useState(false);

  // Fetch categories and videos from API
  useEffect(() => {
    setMounted(true);

    async function fetchCategories() {
      try {
        const res = await fetch("/api/admin/youtube/category");
        const data: Category[] = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    }

    fetchCategories();
  }, []);

  return (
    <main className="px-4 md:px-12 py-10 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-6 mb-12">
        <h1 className="text-3xl sm:text-5xl font-bold text-foreground text-center">
          {!animationDone ? (
        <Typewriter
          words={["Learn With Divyanshu"]}
          loop={1}                // type only once
          cursor={true}           // show cursor while typing
          cursorStyle=""
          typeSpeed={80}
          deleteSpeed={0}
          delaySpeed={500}
          onLoopDone={() => setAnimationDone(true)}
        />
      ) : (
        // static text after animation; no cursor
        "Learn With Divyanshu"
      )}
        </h1>

        <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
          Your gateway to mastering competitive exams, PhD preparation, and academic success through engaging video content
        </p>

       <a
  href="https://www.youtube.com/@UNFILTEREDIITROORKEE"
  target="_blank"
  rel="noopener noreferrer"
>
  <Button size="lg" variant="default" className="rounded-xl">
    <FaYoutube className="mr-2 h-5 w-5" /> Subscribe Now
  </Button>
</a>

      </section>

      {/* Dynamic Categories Section */}
      {mounted && categories.map((category, idx) => (
        <section key={category.id} className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className={cn(categoryColors[idx % categoryColors.length], "text-white p-2 rounded-full")}>
              <FaYoutube className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{category.name}</h2>
              {category.desc && <p className="text-sm text-muted-foreground">{category.desc}</p>}
            </div>
          </div>

          {category.videos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.videos.map((video) => (
                <div
                  key={video.id}
                  className={cn(
                    "rounded-xl border shadow-md p-2 overflow-hidden",
                    theme === "dark" ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200"
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
                    <p className="text-xs text-muted-foreground">{video.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
