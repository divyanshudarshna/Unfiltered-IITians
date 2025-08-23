"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ContentForm from "./ContentForm";
import ContentTable from "./ContentTable";
import { ArrowLeft, Plus, BookOpen, Layers, RotateCcw, BarChart3, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ContentsPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [contents, setContents] = useState<any[]>([]);
  const [course, setCourse] = useState<any>(null);
  const [lectureCounts, setLectureCounts] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourse = async () => {
    try {
      setCourseLoading(true);
      const res = await fetch(`/api/admin/courses/${courseId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch course");
      const data = await res.json();
      setCourse(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load course details");
    } finally {
      setCourseLoading(false);
    }
  };

  const fetchContents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/courses/${courseId}/contents`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch contents");
      const data = await res.json();
      setContents(data);
      
      // Fetch lecture counts for each content
      fetchLectureCounts(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load contents");
    } finally {
      setLoading(false);
    }
  };

  const fetchLectureCounts = async (contentsData: any[]) => {
    try {
      const counts: Record<string, number> = {};
      
      // Use Promise.all to fetch all counts in parallel
      const fetchPromises = contentsData.map(async (content) => {
        try {
          const res = await fetch(`/api/admin/contents/${content.id}/lectures`);
          if (res.ok) {
            const lectures = await res.json();
            counts[content.id] = lectures.length;
          } else {
            counts[content.id] = 0;
          }
        } catch (err) {
          console.error(`Failed to fetch lectures for content ${content.id}:`, err);
          counts[content.id] = 0;
        }
      });
      
      await Promise.all(fetchPromises);
      setLectureCounts(counts);
    } catch (err) {
      console.error("Failed to fetch lecture counts:", err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCourse(), fetchContents()]);
    toast.success("Data refreshed successfully");
    setRefreshing(false);
  };

  useEffect(() => {
    fetchCourse();
    fetchContents();
  }, [courseId]);

  // Calculate total lectures
  const totalLectures = contents.reduce((total, content) => {
    return total + (lectureCounts[content.id] || 0);
  }, 0);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-6xl">
      {/* Header with Back Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
        
          
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              Course Contents
            </h1>
            {courseLoading ? (
              <Skeleton className="h-5 w-64 mt-1" />
            ) : (
              <p className="text-muted-foreground mt-1">
                Managing contents for: <span className="font-medium text-amber-600 dark:text-amber-400">{course?.title || "Unknown Course"}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">

            <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/courses")}
            className="flex items-center mt-1 gap-2 shadow-sm border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Courses</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 shadow-sm"
          >
            <RotateCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="h-4 w-4" />
                <span>New Content</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <ContentForm
                courseId={courseId as string}
                onSuccess={() => {
                  setOpen(false);
                  fetchContents();
                  toast.success("Content created successfully");
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Separator className="my-2" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Contents</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{contents.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/40">
              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Lectures</p>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{totalLectures}</p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Average per Content</p>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {contents.length > 0 ? Math.round(totalLectures / contents.length) : 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/40">
              <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Table */}
      <Card className="shadow-sm border-gray-200 dark:border-gray-700 overflow-hidden px-4 ">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2 my-2">
                <Layers className="w-5 h-5 text-primary" />
                Content Modules
              </CardTitle>
              <CardDescription>
                {contents.length > 0 
                  ? `Manage all content modules for ${course?.title || "this course"}`
                  : `No content modules created yet for ${course?.title || "this course"}`
                }
              </CardDescription>
            </div>
            {contents.length > 0 && (
              <Badge variant="outline" className="w-fit">
                {contents.length} {contents.length === 1 ? 'module' : 'modules'}
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
            <ContentTable 
              courseId={courseId as string} 
              contents={contents} 
              refresh={fetchContents} 
              lectureCounts={lectureCounts}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}