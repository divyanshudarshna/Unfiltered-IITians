"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star, Users, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaYoutube } from "react-icons/fa";
import Link from "next/link";

const stats = [
  {
    number: "05+",
    label: "Years Experience",
    icon: Star,
    href: "/about",
    color: "text-amber-400",
  },
  {
    number: "100+",
    label: "Students Mentored",
    icon: Users,
    href: "/guidance",
    color: "text-emerald-400",
  },
  {
    number: "102K+",
    label: "YouTube Views",
    icon: FaYoutube,
    href: "/youtube",
    color: "text-red-500",
  },
  {
    number: "100%",
    label: "Dedication",
    icon: Target,
    href: "/about",
    color: "text-blue-400",
  },
];

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-screen py-20 px-6 md:px-12 overflow-hidden ">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center space-y-12 relative z-10">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2 }}
          className="space-y-6 max-w-5xl mx-auto text-center"
        >
          <motion.h1
            className="text-4xl md:text-6xl lg:text-6xl font-extrabold tracking-tight leading-tight text-slate-100"
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300">
              Transforming{" "}
              <span className="text-purple-400 drop-shadow-md">
                Biotechnology Education
              </span>
            </span>
            <br />
            Through Research & Mentorship
          </motion.h1>

          <motion.p
            className="mx-auto max-w-3xl text-slate-300/90 text-lg md:text-xl leading-relaxed font-medium"
            initial={{ opacity: 0 }}
            animate={mounted ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 1.0 }}
          >
            IIT Roorkee researcher providing{" "}
            <span className="text-slate-100 font-semibold">
              cutting-edge biotechnology education
            </span>{" "}
            with proven methodologies and{" "}
            <span className="text-slate-100 font-semibold">
              personalized mentorship
            </span>{" "}
            for academic excellence.
          </motion.p>

          {/* Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            <Link
              href="/courses"
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              Explore My Courses →
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl"
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
                transition={{ duration: 0.6}}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
              >
                <Link href={stat.href}>
                  <Card className="relative bg-slate-900/30 backdrop-blur-xl border border-slate-700/30 rounded-xl overflow-hidden group transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-purple-500/20">
                    <CardContent className="p-6 text-center relative z-10">
                      {/* Icon */}
                      <motion.div
                        className="inline-flex items-center justify-center w-12 h-12 bg-slate-800/60 rounded-xl mb-3 shadow-md group-hover:shadow-purple-400/30"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 10 }}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </motion.div>

                      {/* Number */}
                      <motion.div
                        className={`text-2xl font-bold mb-1 ${stat.color}`}
                        initial={{ scale: 0.9, opacity: 0.5 }}
                        animate={mounted ? { scale: 1, opacity: 1 } : {}}
                        transition={{ duration: 0.5, delay: 2.2 + index * 0.2 }}
                      >
                        {stat.number}
                      </motion.div>

                      {/* Label */}
                      <div className="text-sm text-slate-300 font-medium">
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
