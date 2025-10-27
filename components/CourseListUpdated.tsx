// components/CourseList.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

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
  title?: string;
  description?: string;
  showSearch?: boolean;
  courses?: Course[];
  fetchCourses?: boolean;
  countShow?: number;
  showViewAllButton?: boolean;
}

// Course features that will be displayed for each course
const courseFeatures = [
  "Complete syllabus coverage",
  "100+ hours of video lectures",
  "Premium IIT-grade PDF materials",
  "Regular mock tests",
  "Chapter-wise practice questions",
  "Previous year paper solutions",
  "Doubt clearing sessions"
];

export default function CourseList({
  title = "",
  description = "",
  showSearch = false,
  courses: externalCourses,
  fetchCourses = true,
  countShow,
  showViewAllButton = false,
}: CourseListProps) {
  const [courses, setCourses] = useState<Course[]>(externalCourses || []);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(externalCourses || []);
  const [displayedCourses, setDisplayedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(fetchCourses);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentStatuses, setEnrollmentStatuses] = useState<Record<string, EnrollmentStatus>>({});
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
        const response = await fetch("/api/courses");
        if (!response.ok) throw new Error(`Failed to fetch courses: ${response.status}`);
        const data = await response.json();

        const coursesWithEnrollmentCount = data.map((course: Course) => ({
          ...course,
          enrolledStudents: course.enrolledStudents || Math.floor(Math.random() * 1000) + 100,
        }));
        setCourses(coursesWithEnrollmentCount);
        setFilteredCourses(coursesWithEnrollmentCount);

        if (isUserLoaded && user) {
          const statusesArray = await Promise.all(
            coursesWithEnrollmentCount.map(async (course: Course) => {
              try {
                const response = await fetch(`/api/courses/${course.id}/enrollment-status`, {
                  method: "GET",
                  credentials: "include",
                });
                const data = await response.json();
                return response.ok 
                  ? { courseId: course.id, status: data }
                  : { courseId: course.id, status: { isEnrolled: false, error: data.error || `Error: ${response.status}` } };
              } catch (err) {
                return { courseId: course.id, status: { isEnrolled: false, error: "Network error" } };
              }
            })
          );

          const statuses: Record<string, EnrollmentStatus> = {};
          statusesArray.forEach(({ courseId, status }) => {
            statuses[courseId] = status;
          });
          setEnrollmentStatuses(statuses);
        } else if (isUserLoaded && !user) {
          const statuses: Record<string, EnrollmentStatus> = {};
          coursesWithEnrollmentCount.forEach((course: Course) => {
            statuses[course.id] = { isEnrolled: false, canEnroll: true };
          });
          setEnrollmentStatuses(statuses);
        }
      } catch (err) {
        // console.error("Course fetch error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCoursesAndEnrollments();
  }, [externalCourses, fetchCourses, isUserLoaded, user]);

  useEffect(() => {
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

  const getPriceDetails = (price: number, actualPrice?: number) => {
    if (!actualPrice) return { discounted: price, regular: null, discountPercent: 0 };
    const regular = Math.max(price, actualPrice);
    const discounted = Math.min(price, actualPrice);
    const discountPercent = regular > discounted ? Math.round(((regular - discounted) / regular) * 100) : 0;
    return { regular, discounted, discountPercent };
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400">
          <h2 className="text-2xl font-bold mb-2">Unable to load courses</h2>
          <p className="mb-4">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-[#6C2BD9] to-[#8A4FFF] text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Array.from({ length: countShow || 4 }).map((_, i) => (
          <div key={i} className="bg-[#151522]/50 backdrop-blur-lg border border-white/10 rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-gray-700 rounded mb-4 w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded mb-2 w-full"></div>
            <div className="h-4 bg-gray-700 rounded mb-4 w-2/3"></div>
            <div className="space-y-2 mb-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-3 bg-gray-700 rounded w-full"></div>
              ))}
            </div>
            <div className="h-8 bg-gray-700 rounded mb-4"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {displayedCourses.map((course) => {
        const enrollmentStatus = enrollmentStatuses[course.id] || { isEnrolled: false };
        const isEnrolled = enrollmentStatus.isEnrolled;
        const { regular, discounted, discountPercent } = getPriceDetails(course.price, course.actualPrice);

        return (
          <div 
            key={course.id} 
            className="bg-[#151522]/50 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 group flex flex-col h-full"
          >
            {/* Header with badges */}
            <div className="flex justify-between items-start mb-4">
              {/* Discount Badge */}
              {!isEnrolled && discountPercent > 0 && (
                <div className="inline-block bg-green-600  px-3 py-1 rounded-full text-sm font-semibold">
                  {discountPercent}% OFF
                </div>
              )}

            
            </div>

            {/* Course Title */}
            <h3 className="text-2xl font-bold mb-3 group-hover:text-[#8A4FFF] transition-colors relative pb-3">
              {course.title}
              <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-gradient-to-r from-[#6C2BD9] to-[#8A4FFF] rounded-full"></span>
            </h3>

            {/* Course Description */}
            <p className="text-gray-400 mb-4 leading-relaxed flex-grow">
              {course.description || "Comprehensive course with expert instruction and valuable resources."}
            </p>

            {/* Course Features */}
            <div className="mb-6 flex-grow">
              <ul className="space-y-2">
                {courseFeatures.slice(0, 5).map((feature, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-300">
                    <svg 
                      className="w-4 h-4 text-[#8A4FFF] mr-2 mt-0.5 flex-shrink-0" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Course Metadata */}
            <div className="flex items-center justify-between text-sm text-gray-300 mb-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-[#8A4FFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {course.durationMonths} {course.durationMonths === 1 ? "month" : "months"}
              </div>
            
            </div>

            {/* Pricing Section */}
            <div className="mb-6 p-4 bg-gradient-to-r from-[#6C2BD9]/10 to-[#8A4FFF]/10 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{formatPrice(discounted)}</span>
                  {regular && regular > discounted && (
                    <span className="text-gray-400 line-through text-sm">{formatPrice(regular)}</span>
                  )}
                </div>
                {regular && regular > discounted && (
                  <div className="text-xs bg-[#00ff8c] text-[#0D0D15] px-2 py-1 rounded font-semibold">
                    Save {formatPrice(regular - discounted)}
                  </div>
                )}
              </div>
              {discounted === 0 && (
                <div className="text-2xl font-bold text-white">Free</div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-auto">
              {isEnrolled ? (
                <Link 
                  href={`/dashboard/courses/${course.id}`}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white py-3 rounded-full font-semibold text-center transition-all hover:shadow-lg hover:shadow-amber-500/30 flex items-center justify-center gap-2"
                >
                  Start Learning
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              ) : (
                <>
                  <Link 
                    href={`/courses/${course.id}`}
                    className="flex-1 bg-gradient-to-r from-[#00ff8c] to-[#00cc6f] text-[#0D0D15] py-3 rounded-full font-semibold text-center transition-all hover:shadow-lg hover:shadow-green-500/30 flex items-center justify-center gap-2"
                  >
                    {discounted > 0 ? "Enroll Now" : "Start Free"}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link 
                    href={`/courses/${course.id}/details`}
                    className="flex-1 border border-[#8A4FFF] text-[#8A4FFF] py-3 rounded-full font-semibold text-center transition-all hover:bg-[#8A4FFF] hover:text-white flex items-center justify-center gap-2"
                  >
                    Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </Link>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}