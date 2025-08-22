"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { BuyCourseButton } from "@/components/BuyCourseButton"; // import the new component
import { useUser } from "@clerk/nextjs";

interface Course {
  id: string;
  title: string;
  description?: string;
  price: number;
  actualPrice?: number;
  durationMonths?: number;
  isEnrolled?: boolean;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isSignedIn } = useUser();

  // Fetch courses from API
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/courses", {
        headers: { "x-user-id": user?.id || "" },
      });
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data: Course[] = await res.json();
      setCourses(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user]); // refetch when user changes

  const handlePurchaseSuccess = (courseId: string) => {
    // Update local state to mark course as enrolled
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, isEnrolled: true } : c))
    );
  };

  if (loading) return <div>Loading courses...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {courses.map((course) => (
        <Card key={course.id} className="border">
          <CardHeader>
            <CardTitle>{course.title}</CardTitle>
            <CardDescription>{course.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <span className="font-semibold">Price: </span>
              {course.actualPrice && course.actualPrice > course.price ? (
                <>
                  <span className="line-through text-gray-400 mr-2">₹{course.actualPrice}</span>
                  <span className="text-green-600 font-bold">₹{course.price}</span>
                </>
              ) : (
                <span className="font-bold">₹{course.price}</span>
              )}
            </div>
            <div className="mb-2">Duration: {course.durationMonths || 0} month(s)</div>

            <BuyCourseButton
              courseId={course.id}
              courseTitle={course.title}
              amount={course.price}
              isEnrolled={course.isEnrolled}
              onPurchaseSuccess={() => handlePurchaseSuccess(course.id)}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
