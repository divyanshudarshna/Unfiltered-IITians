// app/(main)/my-courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

type MyCourse = {
  id: string;
  title: string;
  description?: string | null;
  durationMonths?: number | null;
  enrolledAt: string;
};

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/my-courses", { cache: "no-store" });
      setLoading(false);
      if (!res.ok) return;
      const data = await res.json();
      setCourses(data);
    })();
  }, []);

  if (loading) return <div className="p-4">Loading your courses...</div>;

  if (!courses.length) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        You haven’t enrolled in any course yet.
      </div>
    );
  }

  return (
    <div className="grid gap-6 p-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((c) => (
        <Card key={c.id}>
          <CardHeader>
            <CardTitle>{c.title}</CardTitle>
            <CardDescription>{c.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm">Duration: {c.durationMonths ?? 0} months</div>
            <Link
              className="rounded-lg px-3 py-2 bg-primary text-primary-foreground hover:opacity-90"
              href={`/my-courses/${c.id}`}
            >
              Go to course
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
