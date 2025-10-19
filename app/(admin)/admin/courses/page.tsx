// app/(admin)/admin/courses/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import CourseTable from "./CourseTable";
import CourseForm from "./CourseForm";
import {
  BookOpen,
  Plus,
  RotateCcw,
  Users,
  TrendingUp,
  FileText,
  PlayCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

enum PublishStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

interface Course {
  id: string;
  title: string;
  description?: string;
  price: number;
  actualPrice?: number;
  durationMonths: number;
  createdAt: string;
  updatedAt: string;
  status: PublishStatus;
  enrollments: number;
  contents: number;
  order?: number;
  inclusions?: {
    id: string;
    inclusionType: 'MOCK_TEST' | 'MOCK_BUNDLE' | 'SESSION';
    inclusionId: string;
  }[];
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/courses", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();

      // Fetch additional data for each course
      const coursesWithDetails = await Promise.all(
        data.map(async (course: Course) => {
          try {
            // Fetch contents count
            const resContents = await fetch(
              `/api/admin/courses/${course.id}/contents`
            );
            let contentsCount = 0;
            if (resContents.ok) {
              const contents = await resContents.json();
              contentsCount = contents.length || 0;
            }

            // Fetch enrollments count
            const resEnrolls = await fetch(
              `/api/admin/courses/${course.id}/enrollments`
            );
            let enrollmentsCount = 0;
            if (resEnrolls.ok) {
              const enrollments = await resEnrolls.json();
              enrollmentsCount = enrollments.length || 0;
            }

            return {
              ...course,
              enrollments: enrollmentsCount,
              contents: contentsCount,
            };
          } catch (err) {
            console.error("Error fetching course details", err);
            return {
              ...course,
              enrollments: 0,
              contents: 0,
            };
          }
        })
      );

      setCourses(coursesWithDetails);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCourses();
    toast.success("Courses refreshed successfully");
    setRefreshing(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Stats calculations
  const stats = {
    totalCourses: courses.length,
    published: courses.filter((c) => c.status === PublishStatus.PUBLISHED)
      .length,
    draft: courses.filter((c) => c.status === PublishStatus.DRAFT).length,
    archived: courses.filter((c) => c.status === PublishStatus.ARCHIVED).length,
    totalEnrollments: courses.reduce((sum, c) => sum + (c.enrollments || 0), 0),
    totalRevenue: courses.reduce(
      (sum, c) => sum + c.price * (c.enrollments || 0),
      0
    ),
    avgCoursePrice:
      courses.length > 0
        ? courses.reduce((sum, c) => sum + c.price, 0) / courses.length
        : 0,
    totalContents: courses.reduce((sum, c) => sum + (c.contents || 0), 0),
  };

  // Data for course status pie chart
  const statusData = [
    { name: "Published", value: stats.published, color: "#10b981" },
    { name: "Draft", value: stats.draft, color: "#f59e0b" },
    { name: "Archived", value: stats.archived, color: "#6b7280" },
  ];

  // Data for enrollment trends (using actual enrollment data)
  const enrollmentData = courses
    .filter((course) => course.enrollments > 0)
    .map((course) => ({
      name:
        course.title.length > 8
          ? `${course.title.substring(0, 8)}...`
          : course.title,
      enrollments: course.enrollments,
      fullName: course.title,
    }))
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, 5);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            Course Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all your courses in one place
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 shadow-sm"
          >
            <RotateCcw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="h-4 w-4" />
                <span>New Course</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                {/* 👇 This is required, either visible or visually hidden */}
                <DialogTitle>Create a New Course</DialogTitle>
              </DialogHeader>

              <CourseForm
                onSuccess={() => {
                  setOpen(false);
                  fetchCourses();
                  toast.success("Course created successfully");
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Separator className="my-2" />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Courses */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.published} published, {stats.draft} draft, {stats.archived}{" "}
              archived
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Enrollments */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Total Enrollments
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              <span>Across all courses</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Total Revenue */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className=" text-amber-600 dark:text-amber-400">₹</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average course price: ₹{stats.avgCoursePrice.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Total Contents */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Total Contents
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlayCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Learning materials across all courses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course Status Pie Chart */}
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Course Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {courses.length > 0 ? (
              <div className="flex flex-col items-center h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      animationDuration={1000}
                      label={({ name, percent }) =>
                        `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                      }
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`status-${entry.name}-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2">
                  {statusData.map((status, index) => (
                    <div key={`status-legend-${status.name}-${index}`} className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-1"
                        style={{ backgroundColor: status.color }}
                      ></div>
                      <span className="text-xs">
                        {status.name}: {status.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No courses to display
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Courses by Enrollment */}
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Top Courses by Enrollment
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {enrollmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={enrollmentData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
                  layout="vertical"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <RechartsTooltip
                    formatter={(value) => [
                      `${value} enrollments`,
                      "Enrollments",
                    ]}
                    labelFormatter={(value) => {
                      const fullName = enrollmentData.find(
                        (item) => item.name === value
                      )?.fullName;
                      return fullName || value;
                    }}
                  />
                  <Bar
                    dataKey="enrollments"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                    animationBegin={200}
                    animationDuration={1000}
                  >
                    {enrollmentData.map((entry, index) => (
                      <Cell
                        key={`enrollment-${entry.name}-${index}`}
                        fill={`url(#colorGradient${index})`}
                      />
                    ))}
                  </Bar>
                  <defs>
                    {enrollmentData.map((entry, index) => (
                      <linearGradient
                        key={`gradient-${entry.name}-${index}`}
                        id={`colorGradient${index}`}
                        x1="0"
                        y1="0"
                        x2="100%"
                        y2="0"
                      >
                        <stop
                          offset="0%"
                          stopColor="#10b981"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="100%"
                          stopColor="#059669"
                          stopOpacity={1}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No enrollment data to display
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Courses Table */}
      <Card className="shadow-lg border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2 mt-3">
                <BookOpen className="w-5 h-5 text-primary" />
                All Courses
              </CardTitle>
              <CardDescription>
                {courses.length > 0
                  ? `Manage your course catalog with ${courses.length} courses`
                  : "No courses created yet. Create your first course to get started"}
              </CardDescription>
              {courses.length > 0 && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Course Ordering:</strong> Use the ↑↓ buttons in the Actions column to reorder courses. 
                    Lower order numbers appear first on the frontend. You can also set custom order when creating/editing courses.
                  </p>
                </div>
              )}
            </div>
            {courses.length > 0 && (
              <Badge variant="secondary" className="w-fit">
                {courses.length} {courses.length === 1 ? "course" : "courses"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <CourseTable courses={courses} refresh={fetchCourses} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
