"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Lecture {
  id: string;
  title: string;
  completed: boolean;
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
}

export const CourseProvider = ({ courseId, children }: Props) => {
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

      const res = await fetch(`/api/courses/${courseId}/contents`, { credentials: "include" });
      const courseJson = await res.json();

      if (!res.ok) {
        setError(courseJson.error || "Failed to load course");
        return;
      }

      const progressRes = await fetch(`/api/courses/progress?courseId=${courseId}`, { credentials: "include" });
      const progressJson = progressRes.ok ? await progressRes.json() : [];

      // Merge progress into course
      courseJson.contents.forEach((content: CourseContent) => {
        content.lectures.forEach((lecture) => {
          const match = progressJson.find((p: any) => p.contentId === content.id && p.completed);
          if (match) lecture.completed = true;
        });
        if (progressJson.some((p: any) => p.contentId === content.id && p.quizScore)) {
          content.quizCompleted = true;
        }
      });

      setCourse(courseJson);
      if (courseJson.contents?.[0]?.lectures?.[0]) {
        setSelectedLecture(courseJson.contents[0].lectures[0]);
        setActiveContent(courseJson.contents[0].id);
      }
      setError(null);
    } catch (err) {
      console.error("Network error:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // Save progress
  const saveProgress = async (contentId: string, completed: boolean, quizScore?: number, totalQuizQuestions?: number) => {
    if (!course) return;
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
      console.error("Failed to save progress:", err);
    }
  };

  // Mark lecture complete and optimistically update UI
  const markLectureComplete = async (lectureId: string) => {
    if (!course) return;
    try {
      await fetch(`/api/courses/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          courseId,
          contentId: activeContent,
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
      console.error("Error marking lecture complete:", err);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

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
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};
