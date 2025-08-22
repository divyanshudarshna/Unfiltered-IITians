// app/(admin)/admin/courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import CourseTable from "./CourseTable";
import CourseForm from "./CourseForm";
import { toast } from "sonner";

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/courses", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">📚 Courses</h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>+ New Course</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <CourseForm
              onSuccess={() => {
                setOpen(false);
                fetchCourses();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <CourseTable courses={courses} refresh={fetchCourses} />
      )}
    </div>
  );
}
