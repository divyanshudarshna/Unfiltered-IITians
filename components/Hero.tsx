"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Users, Eye, Target } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

const stats = [
  { number: "05+", label: "Years Experience", icon: Star, color: "from-purple-400 to-purple-600" },
  { number: "100+", label: "Students Mentored", icon: Users, color: "from-purple-400 to-purple-600" },
  { number: "65K+", label: "YouTube Views", icon: Eye, color: "from-purple-400 to-purple-600" },
  { number: "100%", label: "Success Rate", icon: Target, color: "from-purple-400 to-purple-600" },
];

// 🌟 Spotlight background
function SpotlightBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const background = useTransform(
    [mouseX, mouseY],
    ([x, y]) =>
      `radial-gradient(600px at ${x}px ${y}px, rgba(168,85,247,0.15), transparent 80%)`
  );

  return (
    <motion.div
      className="absolute inset-0 -z-0 opacity-50"
      style={{ background }}
      onMouseMove={(e) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }}
    />
  );
}

// ✨ Floating particles (hydration-safe)
function FloatingParticles() {
  const [particles, setParticles] = useState<
    { width: number; height: number; top: string; left: string; delay: number; duration: number; x: number }[]
  >([]);

  useEffect(() => {
    // generate random positions only on client
    const newParticles = Array.from({ length: 15 }).map(() => ({
      width: Math.random() * 20 + 5,
      height: Math.random() * 20 + 5,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 2,
      duration: Math.random() * 6 + 6,
      x: Math.random() * 25 - 12,
    }));

    setParticles(newParticles);
  }, []);

  return (
    <>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-purple-400/20"
          style={{
            width: p.width,
            height: p.height,
            top: p.top,
            left: p.left,
          }}
          animate={{
            y: [0, -25, 0],
            x: [0, p.x, 0],
            opacity: [0, 0.8, 0],
            scale: [0, 1.2, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
          }}
        />
      ))}
    </>
  );
}

// 🚀 Hero section
export default function Hero() {
  const [countedStats, setCountedStats] = useState(
    stats.map((stat) => ({ ...stat, displayedNumber: "0" }))
  );

  // 🔢 Count-up animation
  useEffect(() => {
    const intervals = stats.map((stat, index) => {
      let start = 0;
      const end = parseInt(stat.number.replace(/\D/g, ""));
      const duration = 2000;
      const increment = end / (duration / 50);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          start = end;
          clearInterval(timer);
        }
        setCountedStats((prev) => {
          const newStats = [...prev];
          newStats[index] = {
            ...newStats[index],
            displayedNumber: stat.number.includes("%")
              ? `${Math.floor(start)}%`
              : Math.floor(start).toLocaleString() + (stat.number.includes("+") ? "+" : ""),
          };
          return newStats;
        });
      }, 50);

      return timer;
    });

    return () => intervals.forEach((interval) => clearInterval(interval));
  }, []);

  return (
    <section className="relative min-h-screen py-20 px-6 md:px-12 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black">
      {/* Background Effects */}
      <SpotlightBackground />
      <FloatingParticles />

      {/* Animated orbs */}
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
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="space-y-6 max-w-5xl mx-auto text-center"
        >
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-purple-400 to-purple-600">
              Transforming
            </span>{" "}
            <span className="text-amber-400 drop-shadow-md font-extrabold">
              Biotechnology
            </span>{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">
              Education
            </span>{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-purple-400 to-purple-600">
              Through Research & Mentorship
            </span>
          </motion.h1>

          <motion.p
            className="mx-auto max-w-3xl text-slate-300/90 text-lg md:text-xl leading-relaxed font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { delayChildren: 1.2, staggerChildren: 0.2 } },
          }}
        >
          {countedStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={index}
                variants={{
                  hidden: { y: 40, opacity: 0 },
                  visible: { y: 0, opacity: 1 },
                }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <Card className="relative bg-slate-800/40 backdrop-blur-xl border border-purple-400/20 rounded-2xl overflow-hidden group hover:bg-slate-800/70 transition-all duration-300 shadow-lg hover:shadow-purple-500/20">
                  {/* Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent rounded-2xl group-hover:from-purple-400/10 transition-all duration-500" />

                  <CardContent className="p-6 text-center relative z-10">
                    <motion.div
                      className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${stat.color} rounded-2xl mb-4 shadow-lg shadow-purple-400/20`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                    </motion.div>

                    <motion.div
                      className="text-4xl font-extrabold text-purple-400 mb-2"
                      key={stat.displayedNumber}
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {stat.displayedNumber}
                    </motion.div>

                    <div className="border-r">

                    </div>
                    <div className="text-sm text-slate-300 font-medium">{stat.label}</div>

                    <div className="mt-4 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, delay: index * 0.3 + 1.5 }}
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
