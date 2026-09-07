"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCompletedLectureIds } from "@/lib/course-learning-state";

interface Lecture {
  id: string;
  title: string;
  completed: boolean;
  locked?: boolean;
  isFreePreview?: boolean;
  summary?: string;
  videoUrl?: string;
  youtubeEmbedUrl?: string;
  pdfUrl?: string;
  order: number;
  studyTips?: string[];
}

interface CourseContent {
  id: string;
  title: string;
  order: number;
  lectures: Lecture[];
  hasQuiz: boolean;
  quizCompleted?: boolean;
  quizId?: string;
}

interface Course {
  id: string;
  title: string;
  contents: CourseContent[];
  progress?: number;
  courseType?: "COMPETITIVE" | "SKILLS" | "WORKSHOP";
  durationMonths?: number;
  enrollmentExpiresAt?: Date | string | null;
  subscriptionExpiresAt?: Date | string | null;
  accessMode?: "FULL" | "PREVIEW";
}

interface CourseContextType {
  course: Course | null;
  loading: boolean;
  error: string | null;
  selectedLecture: Lecture | null;
  activeContent: string;
  setActiveContent: (id: string) => void;
  setSelectedLecture: (lecture: Lecture | null) => void;
  refreshCourse: () => void;
  markLectureComplete: (lectureId: string) => void;
  saveProgress: (contentId: string, completed: boolean, quizScore?: number, totalQuizQuestions?: number) => void;
  isPreview: boolean;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (!context) throw new Error("useCourse must be used within a CourseProvider");
  return context;
};

interface Props {
  courseId: string;
  children: ReactNode;
  preview?: boolean;
}

export const CourseProvider = ({ courseId, children, preview = false }: Props) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [activeContent, setActiveContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch course and merge progress
  const fetchCourse = async () => {
    if (!courseId) return;
    try {
      setLoading(true);

      const res = await fetch(`/api/courses/${courseId}/contents${preview ? "?preview=1" : ""}`, { credentials: "include" });
      const courseJson = await res.json();

      if (!res.ok) {
        if (courseJson.redirectTo && (courseJson.code === "NOT_ENROLLED" || courseJson.code === "EXPIRED" || courseJson.code === "SUBSCRIPTION_EXPIRED")) {
          // Redirect to courses page if user is not enrolled or access has expired
          window.location.href = courseJson.redirectTo;
          return;
        }
        setError(courseJson.error || "Failed to load course");
        return;
      }

      const progressRes = preview ? null : await fetch(`/api/courses/progress?courseId=${courseId}`, { credentials: "include" });
      const progressJson = progressRes?.ok ? await progressRes.json() : { contentProgress: [], lectureProgress: [] };
      const contentProgress = Array.isArray(progressJson) ? progressJson : progressJson.contentProgress ?? [];
      const lectureProgress = Array.isArray(progressJson) ? [] : progressJson.lectureProgress ?? [];
      const completedLectureIds = getCompletedLectureIds(lectureProgress);

      // Sort contents and lectures by order before merging progress
      // Ensure proper numeric sorting
      courseJson.contents = courseJson.contents
        .sort((a: any, b: any) => {
          const orderA = Number(a.order) || 0;
          const orderB = Number(b.order) || 0;
          return orderA - orderB;
        })
        .map((content: any) => ({
          ...content,
          lectures: content.lectures.sort((a: any, b: any) => {
            const orderA = Number(a.order) || 0;
            const orderB = Number(b.order) || 0;
            return orderA - orderB;
          }),
        }));

      // Merge progress into course
      courseJson.contents.forEach((content: CourseContent) => {
        content.lectures.forEach((lecture) => {
          lecture.completed = completedLectureIds.has(lecture.id);
        });
        if (contentProgress.some((p: any) => p.contentId === content.id && p.quizScore !== null && p.quizScore !== undefined)) {
          content.quizCompleted = true;
        }
      });

      setCourse(courseJson);
      const firstAvailable = courseJson.contents
        .flatMap((content: CourseContent) => content.lectures.map((lecture) => ({ content, lecture })))
        .find(({ lecture }: { lecture: Lecture }) => !lecture.locked);
      if (firstAvailable) {
        setSelectedLecture(firstAvailable.lecture);
        setActiveContent(firstAvailable.content.id);
      }
      setError(null);
    } catch (err) {
      // console.error("Network error:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // Save progress
  const saveProgress = async (contentId: string, completed: boolean, quizScore?: number, totalQuizQuestions?: number) => {
    if (!course || preview) return;
    try {
      await fetch(`/api/courses/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          courseId,
          contentId,
          completed,
          quizScore,
          totalQuizQuestions,
        }),
      });
    } catch (err) {
      // console.error("Failed to save progress:", err);
    }
  };

  // Mark lecture complete and optimistically update UI
  const markLectureComplete = async (lectureId: string) => {
    if (!course || preview) return;
    try {
      await fetch(`/api/courses/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          courseId,
          contentId: activeContent,
          lectureId,
          completed: true,
        }),
      });

      const updatedCourse = { ...course };
      updatedCourse.contents = updatedCourse.contents.map((c) => {
        if (c.id === activeContent) {
          return {
            ...c,
            lectures: c.lectures.map((l) => (l.id === lectureId ? { ...l, completed: true } : l)),
          };
        }
        return c;
      });

      setCourse(updatedCourse);
    } catch (err) {
      // console.error("Error marking lecture complete:", err);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId, preview]);

  return (
    <CourseContext.Provider
      value={{
        course,
        loading,
        error,
        selectedLecture,
        activeContent,
        setActiveContent,
        setSelectedLecture,
        refreshCourse: fetchCourse,
        markLectureComplete,
        saveProgress,
        isPreview: preview,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};
