"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star, Users, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaYoutube } from 'react-icons/fa';

const stats = [
  { number: "05+", label: "Years Experience", icon: Star, color: "from-purple-400 to-purple-600", accent: "text-purple-400" },
  { number: "100+", label: "Students Mentored", icon: Users, color: "from-emerald-400 to-emerald-600", accent: "text-emerald-400" },
  { number: "102K+", label: "YouTube Views", icon: FaYoutube, color: "from-red-500 to-red-600", accent: "text-red-400" },
  { number: "100%", label: "Dedication", icon: Target, color: "from-blue-400 to-blue-600", accent: "text-blue-400" },
];

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-screen py-20 px-6 md:px-12 overflow-hidden">
      {/* Animated orbs (keep these for depth, subtle) */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-purple-400/5 rounded-full blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, 30, 0], scale: [1.2, 1, 1.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="max-w-6xl mx-auto flex flex-col items-center text-center space-y-16 relative z-10">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2 }}
          className="space-y-6 max-w-5xl mx-auto text-center"
        >
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.span 
              className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-purple-400 to-purple-600"
              initial={{ opacity: 0 }}
              animate={mounted ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              Transforming
            </motion.span>{" "}
            <motion.span 
              className="text-amber-400 drop-shadow-md font-extrabold"
              initial={{ opacity: 0 }}
              animate={mounted ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 1.0 }}
            >
              Biotechnology
            </motion.span>{" "}
            <motion.span 
              className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600"
              initial={{ opacity: 0 }}
              animate={mounted ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              Education
            </motion.span>{" "}
            <motion.span 
              className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-purple-400 to-purple-600"
              initial={{ opacity: 0 }}
              animate={mounted ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 1.4 }}
            >
              Through Research & Mentorship
            </motion.span>
          </motion.h1>

          <motion.p
            className="mx-auto max-w-3xl text-slate-300/90 text-lg md:text-xl leading-relaxed font-medium"
            initial={{ opacity: 0 }}
            animate={mounted ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 1.6 }}
          >
            IIT Roorkee researcher providing{" "}
            <span className="text-purple-300 font-semibold">cutting-edge biotechnology education</span>{" "}
            with proven methodologies and{" "}
            <span className="text-emerald-400 font-semibold">personalized mentorship</span> for
            academic excellence.
          </motion.p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl"
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
                transition={{ duration: 0.6, delay: 2.0 + index * 0.2 }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
              >
                <Card className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-700/40 rounded-xl overflow-hidden group hover:bg-slate-800/70 transition-all duration-300 shadow-sm hover:shadow-md">
                  {/* Glow */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-all duration-500`}
                  />

                  <CardContent className="p-4 text-center relative z-10">
                    {/* Icon */}
                    <motion.div
                      className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl mb-3 shadow-md`}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </motion.div>

                    {/* Number - Display the complete string as defined in the array */}
                    <motion.div
                      className={`text-2xl font-bold ${stat.accent} mb-1`}
                      initial={{ scale: 0.9, opacity: 0.5 }}
                      animate={mounted ? { scale: 1, opacity: 1 } : {}}
                      transition={{ duration: 0.5, delay: 2.2 + index * 0.2 }}
                    >
                      {stat.number}
                    </motion.div>

                    {/* Label */}
                    <div className="text-xs text-slate-300 font-medium">{stat.label}</div>

                    {/* Progress Bar */}
                    <div className="mt-3 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
                        initial={{ width: 0 }}
                        animate={mounted ? { width: "100%" } : {}}
                        transition={{ duration: 1.5, delay: 2.4 + index * 0.2 }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}