"use client";
import { useEffect, useState } from "react";
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
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description?: string;
  price: number;
  actualPrice?: number;
  durationMonths: number;
  enrolledStudents?: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
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
  { icon: HelpCircle, text: "Weekly Doubt Sessions" },
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
  const [courses, setCourses] = useState<Course[]>(externalCourses || []);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(
    externalCourses || []
  );
  const [displayedCourses, setDisplayedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(fetchCourses);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentStatuses, setEnrollmentStatuses] = useState<
    Record<string, EnrollmentStatus>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isLoaded: isUserLoaded } = useUser();

  useEffect(() => {
    if (externalCourses) {
      setCourses(externalCourses);
      setFilteredCourses(externalCourses);
      setLoading(false);
      return;
    }

    if (!fetchCourses) return;

    const fetchCoursesAndEnrollments = async () => {
      try {
        setLoading(true);
        // Fetch courses
        const response = await fetch("/api/courses");
        if (!response.ok)
          throw new Error(`Failed to fetch courses: ${response.status}`);
        const data = await response.json();

        const coursesWithEnrollmentCount = data.map((course: Course) => ({
          ...course,
          enrolledStudents:
            course.enrolledStudents || Math.floor(Math.random() * 1000) + 100,
        }));
        setCourses(coursesWithEnrollmentCount);
        setFilteredCourses(coursesWithEnrollmentCount);

        // Fetch enrollment statuses for all courses in parallel if user is logged in
        if (isUserLoaded && user) {
          const statusesArray = await Promise.all(
            coursesWithEnrollmentCount.map(async (course: Course) => {
              try {
                const response = await fetch(
                  `/api/courses/${course.id}/enrollment-status`,
                  {
                    method: "GET",
                    credentials: "include",
                  }
                );

                const data = await response.json();

                if (response.ok) {
                  return { courseId: course.id, status: data };
                } else {
                  console.error(
                    `API error for course ${course.id}:`,
                    data.error || response.status
                  );
                  return {
                    courseId: course.id,
                    status: {
                      isEnrolled: false,
                      error: data.error || `Error: ${response.status}`,
                    },
                  };
                }
              } catch (err) {
                console.error(`Network error for course ${course.id}:`, err);
                return {
                  courseId: course.id,
                  status: { isEnrolled: false, error: "Network error" },
                };
              }
            })
          );

          const statuses: Record<string, EnrollmentStatus> = {};
          statusesArray.forEach(({ courseId, status }) => {
            statuses[courseId] = status;
          });

          setEnrollmentStatuses(statuses);
        } else if (isUserLoaded && !user) {
          // User not logged in → default all courses to not enrolled
          const statuses: Record<string, EnrollmentStatus> = {};
          coursesWithEnrollmentCount.forEach((course: Course) => {
            statuses[course.id] = { isEnrolled: false, canEnroll: true };
          });
          setEnrollmentStatuses(statuses);
        }
      } catch (err) {
        console.error("Course fetch error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCoursesAndEnrollments();
  }, [externalCourses, fetchCourses, isUserLoaded, user]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = courses.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses(courses);
    }
  }, [searchQuery, courses]);

  useEffect(() => {
    // Apply countShow limit if provided
    if (countShow && countShow > 0) {
      setDisplayedCourses(filteredCourses.slice(0, countShow));
    } else {
      setDisplayedCourses(filteredCourses);
    }
  }, [filteredCourses, countShow]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  // Price normalization helper
  const getPriceDetails = (price: number, actualPrice?: number) => {
    if (!actualPrice)
      return { discounted: price, regular: null, discountPercent: 0 };
    const regular = Math.max(price, actualPrice);
    const discounted = Math.min(price, actualPrice);
    const discountPercent =
      regular > discounted
        ? Math.round(((regular - discounted) / regular) * 100)
        : 0;
    return { regular, discounted, discountPercent };
  };

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
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Filter courses..."
              className="pl-10 pr-4 py-2 w-full rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            const { regular, discounted, discountPercent } = getPriceDetails(
              course.price,
              course.actualPrice
              );

              return (
                <Card
                  key={course.id}
                  className="overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 group relative"
                >
                  {/* Discount Badge */}
                  {!isEnrolled && discountPercent > 0 && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
                        {discountPercent}% OFF
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
                  </CardHeader>

                  <CardContent className="pb-3 flex-grow">
                    {/* Pricing */}
                    <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                      {discountPercent > 0 ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                              {formatPrice(discounted)}
                            </span>
                            {regular && (
                              <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(regular)}
                              </span>
                            )}
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            >
                              Save {formatPrice((regular || 0) - discounted)}
                            </Badge>
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            {discountPercent}% discount applied
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {discounted > 0 ? formatPrice(discounted) : "Free"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
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
          {discounted > 0 ? "Enroll Now" : "Start Free"}{" "}
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