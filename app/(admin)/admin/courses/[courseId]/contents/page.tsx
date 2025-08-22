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
import { ArrowLeft, Plus, BookOpen, Layers } from "lucide-react";

export default function ContentsPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [contents, setContents] = useState<any[]>([]);
  const [course, setCourse] = useState<any>(null);
  const [lectureCounts, setLectureCounts] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);

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

  useEffect(() => {
    fetchCourse();
    fetchContents();
  }, [courseId]);

  // Calculate total lectures
  const totalLectures = contents.reduce((total, content) => {
    return total + (lectureCounts[content.id] || 0);
  }, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header with Back Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/admin/courses")}
          className="rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Course Contents
          </h1>
          {courseLoading ? (
            <Skeleton className="h-5 w-48 mt-1" />
          ) : (
            <p className="text-muted-foreground">
              Managing contents for: <span className="font-medium text-primary">{course?.title || "Unknown Course"}</span>
            </p>
          )}
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card className="bg-gray-900/50 backdrop-blur-md border border-gray-700/30 shadow-2xl hover:shadow-2xl transition-all duration-300 hover:border-gray-600/50">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-gray-200 flex items-center gap-2">
      <div className="p-1.5 bg-blue-500/20 rounded-lg backdrop-blur-sm">
        <Layers className="h-4 w-4 text-blue-400" />
      </div>
      Total Contents
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex items-end gap-2">
      <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent drop-shadow-md">
        {contents.length}
      </span>
      <span className="text-sm text-gray-400 mb-1">modules</span>
    </div>
    <p className="text-xs text-gray-500 mt-2">Content modules in this course</p>
  </CardContent>
</Card>

<Card className="bg-gray-900/50 backdrop-blur-md border border-gray-700/30 shadow-2xl hover:shadow-2xl transition-all duration-300 hover:border-gray-600/50">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-gray-200 flex items-center gap-2">
      <div className="p-1.5 bg-green-500/20 rounded-lg backdrop-blur-sm">
        <BookOpen className="h-4 w-4 text-green-400" />
      </div>
      Total Lectures
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex items-end gap-2">
      <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent drop-shadow-md">
        {totalLectures}
      </span>
      <span className="text-sm text-gray-400 mb-1">lectures</span>
    </div>
    <p className="text-xs text-gray-500 mt-2">Learning sessions across all content</p>
  </CardContent>
</Card>
        
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  New Content
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-gray-900 border-gray-700">
                <ContentForm
                  courseId={courseId as string}
                  onSuccess={() => {
                    setOpen(false);
                    fetchContents();
                  }}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Content Table */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Content Modules
          </CardTitle>
          <CardDescription>
            Manage all content modules for this course
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <ContentTable 
              courseId={courseId as string} 
              contents={contents} 
              refresh={fetchContents} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}