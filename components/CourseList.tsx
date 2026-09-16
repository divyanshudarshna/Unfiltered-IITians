"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  BookOpen,
  ArrowRight,
  CheckCircle,
  FileText,
  Video,
  HelpCircle,
  Award,
  Bookmark,
  Zap,
  Rocket,
  Search,
  UserCheck,
  PlayCircle,
} from "lucide-react";
import { useCoursesQuery, useBatchStatusQuery } from "@/hooks/useCoursesQuery";
import { getCourseCatalogPricing } from "@/lib/course-catalog-pricing";

interface Course {
  id: string;
  title: string;
  description?: string;
  price?: number;
  actualPrice?: number;
  billingMode?: "ONE_TIME" | "RECURRING";
  subscriptionEnabled?: boolean;
  recurringPlan?: {
    amountPaise: number;
    interval: string;
    totalCount: number;
  } | null;
  durationMonths?: number;
  enrolledStudents?: number;
  status: string;
  instructors?: Array<{
    id: string;
    fullName: string;
    title?: string | null;
    profileImageUrl?: string | null;
  }>;
}

interface EnrollmentStatus {
  isEnrolled: boolean;
  enrolledAt?: string;
  course?: {
    id: string;
    title: string;
    price: number;
    requiresPayment?: boolean;
    description?: string;
  };
  canEnroll?: boolean;
  error?: string;
}

interface CourseListProps {
  readonly title?: string;
  readonly description?: string;
  readonly showSearch?: boolean;
  readonly courses?: Course[];
  readonly fetchCourses?: boolean;
  readonly countShow?: number; // Number of courses to show (optional)
  readonly showViewAllButton?: boolean; // Whether to show "View All Courses" button
}

// Hardcoded course features to display
const courseFeatures = [
  { icon: Video, text: "Video Lectures" },
  { icon: FileText, text: "PDF Notes" },
  { icon: HelpCircle, text: "Dedicated Doubt Sessions" },
  { icon: Award, text: "Quizzes Included" },
  { icon: Bookmark, text: "Study Materials" },
  { icon: Zap, text: "Exam Preparation" },
];

export const revalidate = 60 // ✅ re-generate this page every 60s

export default function CourseList({
  title = "Join courses and crack exams with expert guidance",
  description = "Discover comprehensive courses designed by industry experts to boost your career and exam success.",
  showSearch = true,
  courses: externalCourses,
  fetchCourses = true,
  countShow, // Optional limit on number of courses to display
  showViewAllButton = true, // Show "View All Courses" button by default
}: CourseListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isLoaded: isUserLoaded } = useUser();

  // Use React Query to fetch courses (or use external courses)
  const {
    data: fetchedCourses,
    isLoading: isLoadingCourses,
    error: coursesError,
  } = useCoursesQuery();

  // Determine which courses to use
  const courses = useMemo(() => {
    if (externalCourses) return externalCourses;
    if (!fetchCourses || !fetchedCourses) return [];
    
    // Add random enrollment count for display purposes
    return fetchedCourses.map((course) => ({
      ...course,
      enrolledStudents:
        course.enrolledStudents || Math.floor(Math.random() * 1000) + 100,
    }));
  }, [externalCourses, fetchCourses, fetchedCourses]);

  // Extract course IDs for batch status query
  const courseIds = useMemo(() => courses.map((c) => c.id), [courses]);

  // Use batch status query to fetch enrollment statuses (only if user is logged in)
  const {
    data: batchStatusData,
    isLoading: isLoadingStatus,
  } = useBatchStatusQuery(courseIds);

  // Build enrollment statuses map
  const enrollmentStatuses = useMemo(() => {
    const statuses: Record<string, EnrollmentStatus> = {};
    
    if (!isUserLoaded || !user) {
      // User not logged in - all courses not enrolled
      courses.forEach((course) => {
        statuses[course.id] = { isEnrolled: false, canEnroll: true };
      });
      return statuses;
    }

    if (batchStatusData) {
      // Convert batch status response to enrollment status format
      Object.entries(batchStatusData).forEach(([courseId, status]) => {
        statuses[courseId] = {
          isEnrolled: status.hasAccess,
          canEnroll: !status.hasAccess,
        };
      });
    } else {
      // Default to not enrolled while loading
      courses.forEach((course) => {
        statuses[course.id] = { isEnrolled: false, canEnroll: true };
      });
    }

    return statuses;
  }, [courses, batchStatusData, isUserLoaded, user]);

  // Filter courses by search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery) return courses;
    
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, courses]);

  // Apply countShow limit
  const displayedCourses = useMemo(() => {
    if (countShow && countShow > 0) {
      return filteredCourses.slice(0, countShow);
    }
    return filteredCourses;
  }, [filteredCourses, countShow]);

  const loading = externalCourses ? false : isLoadingCourses || isLoadingStatus;
  const error = coursesError ? (coursesError as Error).message : null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  if (error) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="text-destructive text-center">
          <h2 className="text-2xl font-bold mb-2">Unable to load courses</h2>
          <p className="mb-4">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 mb-4 mt-0">
      {/* Header */}
      <div className="my-12 text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {title}
        </h1>

        <p className="text-muted-foreground max-w-2xl mx-auto text-lg mt-4">
          {description}
        </p>

        {showViewAllButton &&
          countShow &&
          filteredCourses.length > countShow && (
            <div className="flex justify-center mt-10">
              <Button
                asChild
                className="rounded-full border-1 border-purple-500 text-purple-500 px-8 py-3 text-lg font-semibold 
                   bg-transparent hover:bg-purple-900 hover:text-white transition-all duration-300 
                   shadow-sm hover:shadow-purple-500/50 hover:shadow-lg"
              >
                <Link href="/courses" className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Explore All Courses
                </Link>
              </Button>
            </div>
          )}
      </div>

      {/* Search */}
      {showSearch && (
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-blue-200 dark:border-transparent">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Filter courses..."
              className="pl-10 pr-4 py-2 w-full rounded-md border border-blue-300 dark:border-input bg-white dark:bg-background text-slate-900 dark:text-inherit placeholder:text-slate-500 dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: countShow || 6 }, (_, i) => `loading-card-${Date.now()}-${i}`).map((uniqueKey) => (
            <Card key={uniqueKey} className="overflow-hidden h-full flex flex-col">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardHeader>
              <CardContent className="pb-2 flex-grow">
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-1/4 mb-2" />
                <div className="flex justify-between mt-4">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full rounded-md" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && displayedCourses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCourses.map((course) => {
            const enrollmentStatus = enrollmentStatuses[course.id] || {
              isEnrolled: false,
            };
            const isEnrolled = enrollmentStatus.isEnrolled;

            const pricing = getCourseCatalogPricing({
              price: course.price || 0,
              actualPrice: course.actualPrice,
              billingMode: course.billingMode,
              subscriptionEnabled: course.subscriptionEnabled,
              recurringPlan: course.recurringPlan,
            });
            const { amountRupees, regularRupees, discountPercent, oneTimeOption } = pricing;
            const offerDiscountPercent =
              oneTimeOption?.discountPercent ?? discountPercent;

              return (
                <Card
                  key={course.id}
                  className="overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 group relative"
                >
                  {/* Discount Badge */}
                  {!isEnrolled && offerDiscountPercent > 0 && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
                        {offerDiscountPercent}% OFF
                      </Badge>
                    </div>
                  )}

                  {/* Enrolled Badge */}
                  {isEnrolled && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Enrolled
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-3 mt-2">
                    <CardTitle className="text-xl line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 mt-2">
                      {course.description ||
                        "Comprehensive course with expert instruction and valuable resources."}
                    </CardDescription>

                    {/* Instructor badges */}
                    {course.instructors && course.instructors.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {course.instructors.slice(0, 2).map((inst) => (
                          <div
                            key={inst.id}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 rounded-full px-2.5 py-1"
                          >
                            {inst.profileImageUrl ? (
                              <img
                                src={inst.profileImageUrl}
                                alt={inst.fullName}
                                className="h-4 w-4 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                            )}
                            <span className="font-medium text-blue-700 dark:text-blue-300 truncate max-w-[120px]">
                              {inst.fullName}
                            </span>
                          </div>
                        ))}
                        {course.instructors.length > 2 && (
                          <span className="text-xs text-muted-foreground px-2 py-1">
                            +{course.instructors.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="pb-3 flex-grow">
                    {/* Pricing */}
                    <div className="mb-4 overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-blue-50/70 p-3 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/70">
                      {pricing.kind === "RECURRING" && oneTimeOption ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                              Choose your payment
                            </span>
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              2 options
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg border border-blue-300 bg-white/90 p-2.5 ring-1 ring-blue-100 dark:border-blue-600 dark:bg-slate-900/70 dark:ring-blue-900">
                              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                Monthly plan
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-extrabold text-slate-950 dark:text-white">
                                  {formatPrice(amountRupees)}
                                </span>
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                  /month
                                </span>
                              </div>
                              <p className="mt-1 text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                                Spread the cost monthly
                              </p>
                            </div>

                            <div className="relative rounded-lg border border-emerald-300 bg-emerald-50/80 p-2.5 dark:border-emerald-700 dark:bg-emerald-950/20">
                              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                One-time payment
                              </div>
                              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                                <span className="text-xl font-extrabold text-slate-950 dark:text-white">
                                  {oneTimeOption.amountRupees > 0
                                    ? formatPrice(oneTimeOption.amountRupees)
                                    : "Free"}
                                </span>
                                {oneTimeOption.regularRupees && (
                                  <span className="text-[10px] text-slate-500 line-through dark:text-slate-400">
                                    {formatPrice(oneTimeOption.regularRupees)}
                                  </span>
                                )}
                              </div>
                              {oneTimeOption.savingsRupees > 0 ? (
                                <p className="mt-1 text-[10px] font-semibold leading-tight text-emerald-700 dark:text-emerald-400">
                                  Save {formatPrice(oneTimeOption.savingsRupees)} | {oneTimeOption.discountPercent}% off
                                </p>
                              ) : (
                                <p className="mt-1 text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                                  Pay once for full access
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : discountPercent > 0 ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                              {formatPrice(amountRupees)}
                            </span>
                            {regularRupees && (
                              <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(regularRupees)}
                              </span>
                            )}
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            >
                              Save {formatPrice((regularRupees || 0) - amountRupees)}
                            </Badge>
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            {discountPercent}% discount applied
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {amountRupees > 0 ? formatPrice(amountRupees) : "Free"}
                          </span>
                          {pricing.suffix && (
                            <span className="text-sm font-medium text-muted-foreground">
                              {pricing.suffix}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    {course.durationMonths && (
                      <div className="flex flex-wrap gap-3 mb-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1 text-blue-500" />
                          {course.durationMonths}{" "}
                          {course.durationMonths === 1 ? "month" : "months"}
                        </div>
                        {/* <div className="flex items-center text-sm text-muted-foreground">
                          <BookOpen className="h-4 w-4 mr-1 text-blue-500" />
                          {course.enrolledStudents}+ enrolled
                        </div> */}
                      </div>
                    )}

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {courseFeatures.slice(0, 4).map((feature, index) => (
                        <div
                          key={`${course.id}-feature-${index}`}
                          className="flex items-center text-sm text-muted-foreground"
                        >
                          <feature.icon className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="text-xs">{feature.text}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                 <CardFooter className="flex gap-3">
  {isEnrolled ? (
    <Button
      asChild
      className="flex-1 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white transition-all duration-200 shadow-md hover:shadow-lg"
    >
      <Link
        href={`/dashboard/courses/${course.id}`}
        className="flex items-center justify-center gap-2"
      >
        Start Learning <Rocket className="h-4 w-4" />
      </Link>
    </Button>
  ) : (
    <>
      {/* Enroll Button → Payment page */}
      <Button
        asChild
        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
      >
        <Link href={`/courses/${course.id}`}>
          {amountRupees > 0 ? "Enroll Now" : "Start Free"}{" "}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>

      {/* Details Button → Full course details page */}
      <Button
        asChild
        variant="outline"
        className="flex-1 border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-300"
      >
        <Link href={`/courses/${course.id}/details`}>
          Details <BookOpen className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </>
  )}
</CardFooter>

                </Card>
              );
            })}
          </div>
      )}

      {!loading && displayedCourses.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="bg-muted p-6 rounded-full mb-4">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Courses Found</h2>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? `No courses match your search for "${searchQuery}"`
              : "There are no published courses at the moment."}
          </p>
          {searchQuery && (
            <Button onClick={() => setSearchQuery("")}>Clear Search</Button>
          )}
        </div>
      )}
    </div>
  );
}
