// app/(admin)/admin/contents/[contentId]/lectures/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import LectureTable from "./LectureTable";
import Link from "next/link";
import { Plus, ArrowLeft, BookOpen, FileText, GraduationCap } from "lucide-react";

interface ContentInfo {
  id: string;
  title: string;
  description: string;
  course: {
    id: string;
    title: string;
  };
}

export default function LecturesPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = React.use(params);
  const [lectures, setLectures] = useState<any[]>([]);
  const [contentInfo, setContentInfo] = useState<ContentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(true);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/contents/${contentId}/lectures`);
      if (!res.ok) throw new Error("Failed to load lectures");
      const data = await res.json();
      setLectures(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load lectures");
    } finally {
      setLoading(false);
    }
  };

  const fetchContentInfo = async () => {
    try {
      setContentLoading(true);
      const res = await fetch(`/api/admin/contents/${contentId}`);
      if (!res.ok) throw new Error("Failed to load content");
      const data = await res.json();
      setContentInfo(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load content information");
    } finally {
      setContentLoading(false);
    }
  };

  useEffect(() => {
    fetchLectures();
    fetchContentInfo();
  }, [contentId]);

  if (loading || contentLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-8 w-64" />
          </div>
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/courses/${contentInfo?.course.id}/contents`}>
            <Button variant="outline" size="icon" className="h-11 w-11">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                Course
              </Badge>
              <span className="text-sm font-medium text-muted-foreground">
                {contentInfo?.course.title}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />
              {contentInfo?.title}
            </h1>
            <p className="text-muted-foreground">
              Manage lectures for this course content module
            </p>
          </div>
        </div>

        {/* Add Lecture Button */}
        <Link href={`/admin/contents/${contentId}/lectures/add`}>
          <Button className="gap-2 h-11 px-6">
            <Plus className="h-4 w-4" />
            Add New Lecture
          </Button>
        </Link>
      </div>

      <Separator />

      {/* Statistics Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-700">
  <CardHeader className="pb-2">
    <CardTitle className="text-lg flex items-center gap-2">
      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      Total Lectures
    </CardTitle>
    <CardDescription className="dark:text-blue-300">
      Number of lectures in this content
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
      {lectures.length}
    </div>
  </CardContent>
</Card>

<Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-700">
  <CardHeader className="pb-2">
    <CardTitle className="text-lg flex items-center gap-2">
      <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
      With Videos
    </CardTitle>
    <CardDescription className="dark:text-green-300">
      Lectures containing video content
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-green-700 dark:text-green-300">
      {lectures.filter(lec => lec.videoUrl).length}
    </div>
  </CardContent>
</Card>

<Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-700">
  <CardHeader className="pb-2">
    <CardTitle className="text-lg flex items-center gap-2">
      <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      With Materials
    </CardTitle>
    <CardDescription className="dark:text-purple-300">
      Lectures with PDF materials
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
      {lectures.filter(lec => lec.pdfUrl).length}
    </div>
  </CardContent>
</Card>
      </div>

      {/* Lectures Table Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Lecture Management
          </CardTitle>
          <CardDescription>
            Manage all lectures for "{contentInfo?.title}". You can edit, delete, or preview lectures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LectureTable
            lectures={lectures}
            refresh={fetchLectures}
            contentId={contentId}
          />
        </CardContent>
      </Card>

      {/* Quick Actions Footer */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-4 bg-muted/50 rounded-lg">
        <div className="text-sm text-muted-foreground">
          <strong>Tip:</strong> Drag and drop to reorder lectures for better learning flow.
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/courses/${contentInfo?.course.id}/contents`}>
            <Button variant="outline" size="sm">
              Back to Contents
            </Button>
          </Link>
          <Link href={`/admin/courses`}>
            <Button variant="outline" size="sm">
              View All Courses
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}