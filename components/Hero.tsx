"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star, Users, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaYoutube } from "react-icons/fa";
import Link from "next/link";
export const dynamic = "force-static";

const stats = [
  {
    number: "05+",
    label: "Years Experience",
    icon: Star,
    href: "/about",
    color: "text-amber-500",
    glow: "shadow-amber-400/50",
  },
  {
    number: "100+",
    label: "Students Mentored",
    icon: Users,
    href: "/guidance",
    color: "text-emerald-500",
    glow: "shadow-emerald-400/50",
  },
  {
    number: "100,000+",
    label: "YouTube Views",
    icon: FaYoutube,
    href: "/youtube",
    color: "text-red-500",
    glow: "shadow-red-500/50",
  },
  {
    number: "100%",
    label: "Dedication",
    icon: Target,
    href: "/about",
    color: "text-blue-500",
    glow: "shadow-blue-400/50",
  },
];

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-screen py-24 px-6 md:px-12 overflow-hidden  transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center space-y-16 relative z-10">
    {/* Headline */}
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={mounted ? { opacity: 1, y: 0 } : {}}
  transition={{ duration: 1, delay: 0.2 }}
  className="space-y-8 max-w-7xl mx-auto text-center"
>
  <motion.h1
    className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-slate-100"
    initial={{ opacity: 0, y: 20 }}
    animate={mounted ? { opacity: 1, y: 0 } : {}}
    transition={{ duration: 0.8, delay: 0.6 }}
  >
    <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-slate-100 dark:via-slate-200 dark:to-slate-300">
      Your Gateway to{" "}
      <span className="text-purple-600 dark:text-purple-400 drop-shadow-md">
        IITs {" "}
      </span>
    </span>{" "}
    through Biology
  </motion.h1>

  <motion.p
    className="mx-auto max-w-3xl text-slate-600 text-center dark:text-slate-300 text-xl md:text-2xl leading-relaxed font-medium"
    initial={{ opacity: 0 }}
    animate={mounted ? { opacity: 1 } : {}}
    transition={{ duration: 1, delay: 1.0 }}
  >
    As an <span className="font-semibold text-slate-900 dark:text-slate-100">IIT Bombay alumnus</span>,{" "}
    <span className="font-semibold text-slate-900 dark:text-slate-100">IIT Roorkee researcher</span>, and{" "}
    <span className="font-semibold text-slate-900 dark:text-slate-100">academic mentor</span>, 
    I bridge the gap between complex scientific concepts and student success with{" "}
    <span className="font-semibold text-slate-900 dark:text-slate-100">proven strategies</span> and{" "}
    <span className="font-semibold text-slate-900 dark:text-slate-100">personalized guidance</span>.
  </motion.p>

  {/* Button */}
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={mounted ? { opacity: 1, y: 0 } : {}}
    transition={{ duration: 0.8, delay: 1.4 }}
  >
    <Link
      href="/courses"
      prefetch={true}
      className="px-8 py-4 bg-purple-600 text-white font-semibold text-lg rounded-full shadow-lg hover:shadow-purple-500/40 transition-all"
    >
      Explore My Courses →
    </Link>
  </motion.div>
</motion.div>


        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-5xl"
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 1.8 }}
        >
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                animate={mounted ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.6 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <Link href={stat.href} prefetch={true}>
                  <Card className="relative bg-slate-100 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-300 dark:border-slate-700/30 rounded-2xl overflow-hidden group transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-purple-500/20">
                    <CardContent className="p-8 text-center relative z-10">
                      {/* Icon */}
                      <motion.div
                        className={`inline-flex items-center justify-center w-16 h-16 bg-slate-200 dark:bg-slate-800/60 rounded-2xl mb-4 shadow-md group-hover:scale-110 transition-all duration-300`}
                      >
                        <IconComponent
                          className={`w-8 h-8 text-slate-700 dark:text-white group-hover:${stat.color} group-hover:drop-shadow-[0_0_12px] ${stat.glow}`}
                        />
                      </motion.div>

                      {/* Number */}
                      <motion.div
                        className={`text-3xl md:text-4xl font-bold mb-2 ${stat.color}`}
                        initial={{ scale: 0.9, opacity: 0.5 }}
                        animate={mounted ? { scale: 1, opacity: 1 } : {}}
                        transition={{ duration: 0.5, delay: 2.2 + index * 0.2 }}
                      >
                        {stat.number}
                      </motion.div>

                      {/* Label */}
                      <div className="text-base text-slate-700 dark:text-slate-300 font-medium">
                        {stat.label}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
