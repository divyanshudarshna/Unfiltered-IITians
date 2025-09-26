"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit3, BookOpen, Calendar, Zap } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  detailsCount: number;
  durationMonths?: number;
  price?: number;
}

export default function CourseDetailsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/admin/courses/list");
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        console.error("❌ Failed to fetch courses:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "default";
      case "DRAFT":
        return "secondary";
      case "ARCHIVED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return "Free";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-6">

        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Manage Course Details
              </h1>
              <p className="text-gray-400">Create and manage course content structure</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-gray-800/50 border-gray-700 rounded-xl overflow-hidden">
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-3/4 bg-gray-700" />
                  <Skeleton className="h-4 w-full bg-gray-700 mt-2" />
                </CardHeader>
                <CardContent className="pb-3">
                  <Skeleton className="h-4 w-full bg-gray-700 mb-2" />
                  <Skeleton className="h-4 w-2/3 bg-gray-700" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full bg-gray-700 rounded-lg" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl backdrop-blur-sm">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
                Course Details Manager
              </h1>
              <p className="text-gray-400 mt-1">
                Design engaging course structures with modules and lessons
              </p>
            </div>
          </div>
          
          <Badge variant="outline" className="px-3 py-1 border-blue-500/50 text-blue-300">
            {courses.length} {courses.length === 1 ? 'Course' : 'Courses'}
          </Badge>
        </div>

        
        {/* Footer Stats */}
        {courses.length > 0 && (
          <div className="mt-8 p-6 bg-gray-800/30 rounded-xl border border-gray-700/50 my-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-white">{courses.length}</div>
                <div className="text-sm text-gray-400">Total Courses</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {courses.filter(c => c.status === 'PUBLISHED').length}
                </div>
                <div className="text-sm text-gray-400">Published</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {courses.reduce((acc, course) => acc + course.detailsCount, 0)}
                </div>
                <div className="text-sm text-gray-400">Total Modules</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">
                  {courses.filter(c => c.price && c.price > 0).length}
                </div>
                <div className="text-sm text-gray-400">Paid Courses</div>
              </div>
            </div>
          </div>
        )}

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-800/50 rounded-full flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No courses found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Start by creating your first course to build an amazing learning experience.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card 
                key={course.id}
                className="group bg-gray-800/40 border-gray-700/50 rounded-2xl overflow-hidden transition-all duration-300 hover:bg-gray-800/60 hover:border-blue-500/30 hover:shadow-2xl hover:scale-105"
              >
                <CardHeader className="pb-3 relative">
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="flex items-start justify-between relative z-10">
                    <CardTitle className="text-lg font-bold text-white line-clamp-2 pr-2">
                      {course.title}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-amber-400 bg-gray-700/50 px-2 py-1 rounded-full">
                        {course.detailsCount}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 relative z-10">
                    <Badge variant={getStatusVariant(course.status)} className="text-xs">
                      {course.status}
                    </Badge>
                    {course.durationMonths && (
                      <Badge variant="outline" className="text-xs border-green-500/30 text-green-300">
                        <Calendar className="w-3 h-3 mr-1" />
                        {course.durationMonths}mo
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pb-4 relative z-10">
                  <p className="text-sm text-gray-300 line-clamp-3 mb-4 leading-relaxed">
                    {course.description || "No description available yet. Add a compelling course overview."}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        {formatPrice(course.price)}
                      </span>
                      <span>
                        {new Date(course.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="relative z-10">
                  <Button
                    onClick={() => router.push(`/admin/course-details/${course.id}/edit`)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-2.5 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg group/btn"
                  >
                    <Edit3 className="w-4 h-4 mr-2 transition-transform group-hover/btn:rotate-12" />
                    Design Course Structure
                  </Button>
                </CardFooter>

                {/* Hover Effect Border */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/20 rounded-2xl transition-all duration-300 pointer-events-none" />
              </Card>
            ))}
          </div>
        )}

        
      </div>
    </div>
  );
}