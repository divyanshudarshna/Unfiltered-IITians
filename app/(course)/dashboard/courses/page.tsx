// app/dashboard/courses/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import {
  BookOpen,
  Clock,
  Award,
  ChevronRight,
  Star,
  Zap,
  Target,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type EnrollmentItem = {
  id: string;
  title: string;
  description?: string;
  price: number;
  actualPrice: number;
  status: string;
  enrolledAt: string;
  progress: number; // original backend field (kept)
  totalContents: number;
  completedContents: number;
  validTill: string;
  category?: string;
  level?: string;
  instructor?: string;
  thumbnail?: string;
};

// Extended type used locally: adds lesson-based progress
type EnrollmentWithComputed = EnrollmentItem & { progressFromLessons: number };

export default function MyCoursesPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [data, setData] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "in-progress" | "completed"
  >("all");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/courses/enrollments`, {
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load");
        setData(json);
      } catch (e: any) {
        setErr(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, isSignedIn, router]);

  // --------------------------
  // 1) Enrich original data with lesson-based progress
  // --------------------------
  const enrichedData = useMemo<EnrollmentWithComputed[]>(
    () =>
      data.map((item) => {
        const total = item.totalContents ?? 0;
        const computed =
          total > 0 ? Math.floor((item.completedContents / total) * 100) : 0;
        return { ...item, progressFromLessons: computed };
      }),
    [data]
  );

  // --------------------------
  // 2) Use enrichedData everywhere instead of raw data.progress
  // --------------------------
  const filteredData = useMemo<EnrollmentWithComputed[]>(() => {
    if (activeTab === "all") return enrichedData;
    if (activeTab === "in-progress")
      return enrichedData.filter((item) => item.progressFromLessons < 100);
    return enrichedData.filter((item) => item.progressFromLessons >= 100);
  }, [enrichedData, activeTab]);

  const recentCourses = useMemo(
    () =>
      [...enrichedData]
        .sort(
          (a, b) =>
            new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime()
        )
        .slice(0, 3),
    [enrichedData]
  );

  const avgProgress = useMemo(() => {
    if (!enrichedData.length) return 0;
    return Math.round(
      enrichedData.reduce((acc, curr) => acc + (curr.progressFromLessons || 0), 0) /
        enrichedData.length
    );
  }, [enrichedData]);

  // Small helpers
  const fmt = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const cardGlow =
    "hover:shadow-xl hover:shadow-cyan-500/20 dark:hover:shadow-cyan-400/10 hover:-translate-y-1 transition-all duration-300";

  // --------------------------
  // RENDERING (unchanged UI, but uses progressFromLessons)
  // --------------------------
  if (loading) {
    return (
      <div className="w-full min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Navbar />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card
                key={i}
                className="rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm"
              >
                <Skeleton className="h-40 w-full rounded-b-none" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (err) {
    return (
      <div className="w-full min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Navbar />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex items-center justify-center">
          <div className="text-center p-8 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm shadow-md border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Something went wrong
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{err}</p>
            <Button
              onClick={() => location.reload()}
              className="rounded-full px-6 py-3 shadow-md bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700"
            >
              Try Again
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!enrichedData.length) {
    return (
      <div className="w-full min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Navbar />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col items-center justify-center">
          <div
            className={cn(
              "text-center max-w-md mx-auto p-8 rounded-2xl backdrop-blur-sm shadow-md border",
              "bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
            )}
          >
            <div className="w-20 h-20 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-10 w-10 text-sky-600 dark:text-sky-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Your Learning Journey Awaits
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              You haven't enrolled in any courses yet. Explore our catalog to
              start your learning adventure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                className="rounded-full px-6 py-3 shadow-md bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700"
              >
                <Link href="/courses">Browse Courses</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full px-6 py-3 border-sky-300 text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:border-sky-700 dark:hover:bg-slate-800"
              >
                <Link href="/mocks">Try Practice Mocks</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col ">
      <BackgroundWrapper>
        <Navbar />

        <main className="flex-1 p-6 max-w-7xl mx-auto mt-12 w-full">
          <div className="mb-8 mt-4">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-4xl font-bold text-slate-900 dark:text-primary-foreground mb-2"
            >
              My Courses
            </motion.h1>
            <p className="text-slate-600 dark:text-slate-400">
              Continue your learning journey and track your progress
            </p>
          </div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <div
              className={cn(
                "p-4 rounded-2xl border shadow-sm",
                "bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800",
                cardGlow
              )}
            >
              <div className="flex items-center">
                <div className="p-3 rounded-xl mr-4 bg-sky-100 dark:bg-sky-900/30">
                  <BookOpen className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Enrolled Courses
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {enrichedData.length}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "p-4 rounded-2xl border shadow-sm",
                "bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800",
                cardGlow
              )}
            >
              <div className="flex items-center">
                <div className="p-3 rounded-xl mr-4 bg-cyan-100 dark:bg-cyan-900/30">
                  <BarChart3 className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Average Progress
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {avgProgress}%
                  </p>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "p-4 rounded-2xl border shadow-sm",
                "bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800",
                cardGlow
              )}
            >
              <div className="flex items-center">
                <div className="p-3 rounded-xl mr-4 bg-emerald-100 dark:bg-emerald-900/30">
                  <Award className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Completed
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {enrichedData.filter((item) => item.progressFromLessons >= 100)
                      .length}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recently Accessed */}
          {recentCourses.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="mb-10"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Recently Accessed
                </h2>
                <Link
                  href="/courses"
                  className="text-sky-700 dark:text-sky-400 hover:opacity-80 text-sm font-medium flex items-center"
                >
                  Browse all courses <ChevronRight className="h-4 w-4 ml-0.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentCourses.map((course, idx) => (
                  <Card
                    key={course.id}
                    className={cn(
                      "rounded-2xl overflow-hidden border bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm border-slate-200 dark:border-slate-800",
                      cardGlow,
                      "group"
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="my-3">
                        <div className="absolute top-3 right-3">
                          <Badge
                            className={cn(
                              "px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm",
                              course.progressFromLessons === 0
                                ? "bg-amber-100 text-amber-800"
                                : course.progressFromLessons < 100
                                ? "bg-sky-100 text-sky-800"
                                : "bg-emerald-100 text-emerald-800"
                            )}
                          >
                            {course.progressFromLessons === 0
                              ? "Not Started"
                              : course.progressFromLessons < 100
                              ? "In Progress"
                              : "Completed"}
                          </Badge>
                        </div>
                      </div>

                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {course.description || "No description available."}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-3 my-3">
                      <div className="flex items-center justify-between mb-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          <span>Enrolled {fmt(course.enrolledAt)}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          <span>Valid till: {fmt(course.validTill)}</span>
                        </div>
                      </div>

                      {/* USE lesson-based progress here */}
                      <Progress value={course.progressFromLessons} className="h-2 mb-3" />

                      <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                        <span>{course.progressFromLessons}% Complete</span>
                        <span>
                          {course.completedContents}/{course.totalContents} Lessons
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button
                        asChild
                        className={cn(
                          "w-full rounded-xl py-3 font-medium transition-all duration-300",
                          "bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700",
                          "shadow-md hover:shadow-lg hover:shadow-sky-500/30 group-hover:scale-[1.02]"
                        )}
                      >
                        <Link href={`/dashboard/courses/${course.id}`}>
                          {course.progressFromLessons >= 100
                            ? "Review Course"
                            : "Continue Learning"}
                          <Zap className="ml-2 h-4 w-4 group-hover:animate-pulse" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </motion.section>
          )}

          {/* My Courses + Filters (uses filteredData which is based on progressFromLessons) */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                My Courses
              </h2>

              <Tabs
                defaultValue="all"
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as typeof activeTab)}
                className="w-fit"
              >
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <TabsTrigger
                    value="all"
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-sm"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="in-progress"
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-sm"
                  >
                    In Progress
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-sm"
                  >
                    Completed
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {filteredData.length === 0 ? (
              <div
                className={cn(
                  "text-center py-12 rounded-2xl border border-dashed",
                  "bg-white/70 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700"
                )}
              >
                <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">
                  {activeTab === "in-progress"
                    ? "No courses in progress"
                    : "No completed courses"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  {activeTab === "in-progress"
                    ? "Start learning to see your progress here"
                    : "Complete a course to see it here"}
                </p>
                <Button className="rounded-full bg-sky-600 hover:bg-sky-700 text-white">
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredData.map((course, idx) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, scale: 0.98, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: idx * 0.05 }}
                  >
                    <Card
                      className={cn(
                        "flex flex-col rounded-2xl overflow-hidden border bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm border-slate-200 dark:border-slate-800",
                        cardGlow,
                        "group h-full"
                      )}
                    >
                      <CardHeader className="pb-2">
                        <div className="m-4">
                          <div className="absolute top-1 left-2">
                            <Badge
                              variant="secondary"
                              className="bg-white/90 dark:bg-slate-900/70 backdrop-blur-sm text-slate-800 dark:text-slate-200 rounded-full px-2 py-1 text-xs font-medium"
                            >
                              {course.category || "General"}
                            </Badge>
                          </div>

                          <div className="absolute top-3 right-3">
                            <div className="bg-black/35 dark:bg-black/40 backdrop-blur-sm rounded-full p-1.5">
                              {course.progressFromLessons >= 100 ? (
                                <Award className="h-4 w-4 text-amber-300" />
                              ) : (
                                <Star className="h-4 w-4 text-amber-300" />
                              )}
                            </div>
                          </div>
                        </div>

                        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors">
                          {course.title}
                        </CardTitle>

                        <div className="flex items-center mt-1">
                          <Badge
                            className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-semibold",
                              course.progressFromLessons === 0
                                ? "bg-amber-100 text-amber-800"
                                : course.progressFromLessons < 100
                                ? "bg-sky-100 text-sky-800"
                                : "bg-emerald-100 text-emerald-800"
                            )}
                          >
                            {course.progressFromLessons === 0
                              ? "Not Started"
                              : course.progressFromLessons < 100
                              ? "In Progress"
                              : "Completed"}
                          </Badge>

                          <Badge
                            variant="outline"
                            className="ml-2 px-2 py-0.5 rounded-full text-xs"
                          >
                            {course.level || "All Levels"}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1 pb-3 my-3">
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                          {course.description || "No description available."}
                        </p>

                        <div className="flex items-center justify-between mb-2 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            <span>Enrolled {fmt(course.enrolledAt)}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            <span>Valid till: {fmt(course.validTill)}</span>
                          </div>
                        </div>

                        <Progress
                          value={course.progressFromLessons}
                          className="h-2 mb-3"
                        />

                        <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-4">
                          <span>{course.progressFromLessons}% Complete</span>
                          <span>
                            {course.completedContents}/{course.totalContents} Lessons
                          </span>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-0">
                        <Button
                          asChild
                          className={cn(
                            "w-full rounded-xl py-3 font-medium transition-all duration-300",
                            "bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700",
                            "shadow-md hover:shadow-lg hover:shadow-sky-500/30 group-hover:scale-[1.02]"
                          )}
                        >
                          <Link href={`/dashboard/courses/${course.id}`}>
                            {course.progressFromLessons >= 100
                              ? "Review Course"
                              : "Continue Learning"}
                            <Zap className="ml-2 h-4 w-4 group-hover:animate-pulse" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Mocks CTA */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="mt-12 mb-8"
          >
            <div
              className={cn(
                "rounded-2xl p-6 text-white shadow-md",
                "bg-slate-800 border-r border-1 border-cyan-700"
              )}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl text-cyan-600 font-bold mb-1">
                    Ready to test your knowledge?
                  </h2>
                  <p className="opacity-90">
                    Practice with our mock tests and track your progress
                  </p>
                </div>
                <Button
                  asChild
                  className="bg-white text-sky-700 hover:bg-slate-900 hover:text-cyan-400 rounded-full px-6 py-3 font-medium shadow-md transition-all duration-300 ease-in-out"
                >
                  <Link href="/mocks">
                    Try Practice Mocks
                    <Target className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.section>
        </main>

        <Footer />
      </BackgroundWrapper>
    </div>
  );
}
