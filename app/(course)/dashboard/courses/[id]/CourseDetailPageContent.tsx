"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookOpen, PlayCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import CourseSidebar from "./components/CourseSidebar";
import LectureContent from "./components/LectureContent";
import Quiz from "./components/Quiz";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCourse } from "@/app/contexts/CourseContext";

export default function CourseDetailPageContent() {
  const {
    course,
    selectedLecture,
    activeContent,
    setSelectedLecture,
    setActiveContent,
    loading,
    error,
    saveProgress,
    markLectureComplete,
  } = useCourse();

  const { theme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizContentId, setCurrentQuizContentId] = useState<string | null>(null);

  // Helpers
  const findLecturePosition = () => {
    if (!course || !selectedLecture) return null;
    for (let ci = 0; ci < course.contents.length; ci++) {
      const content = course.contents[ci];
      const li = content.lectures.findIndex((l) => l.id === selectedLecture.id);
      if (li !== -1) return { ci, li };
    }
    return null;
  };

  // Next lecture/quiz handler
  const handleNext = () => {
    if (!course || !selectedLecture) return;
    const pos = findLecturePosition();
    if (!pos) return;

    const { ci, li } = pos;
    const currentContent = course.contents[ci];

    if (li + 1 < currentContent.lectures.length) {
      setSelectedLecture(currentContent.lectures[li + 1]);
      return;
    }

    if (currentContent.hasQuiz && !currentContent.quizCompleted) {
      setCurrentQuizContentId(currentContent.id);
      setShowQuiz(true);
      return;
    }

    if (ci + 1 < course.contents.length) {
      const nextContent = course.contents[ci + 1];
      if (nextContent.lectures.length > 0) {
        setSelectedLecture(nextContent.lectures[0]);
        setActiveContent(nextContent.id);
      }
    }
  };

  // Previous lecture/quiz handler
  const handlePrevious = () => {
    if (!course || !selectedLecture) return;
    const pos = findLecturePosition();
    if (!pos) return;

    const { ci, li } = pos;

    if (li > 0) {
      setSelectedLecture(course.contents[ci].lectures[li - 1]);
      return;
    }

    if (ci > 0) {
      const prevContent = course.contents[ci - 1];
      if (prevContent.hasQuiz && !prevContent.quizCompleted) {
        setCurrentQuizContentId(prevContent.id);
        setShowQuiz(true);
        return;
      }
      if (prevContent.lectures.length > 0) {
        setSelectedLecture(prevContent.lectures[prevContent.lectures.length - 1]);
        setActiveContent(prevContent.id);
      }
    }
  };

  // Quiz handlers
  const handleQuizComplete = (score: number, total: number) => {
    if (course && currentQuizContentId) {
      saveProgress(currentQuizContentId, true, score, total);
    }
    setShowQuiz(false);
    setCurrentQuizContentId(null);
  };

  const handleQuizCancel = () => {
    setShowQuiz(false);
    setCurrentQuizContentId(null);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-80 border-r p-4">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Course</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
          <p className="text-muted-foreground">
            The requested course could not be found.
          </p>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
  <div
  className={cn(
    "h-full border-r overflow-hidden transition-[width,opacity] duration-300 ease-in-out",
    isSidebarCollapsed
      ? "w-0 opacity-0 pointer-events-none"
      : "w-[350px] opacity-100"
  )}
>
        <CourseSidebar
          course={course}
          selectedLecture={selectedLecture}
          setSelectedLecture={setSelectedLecture}
          activeContent={activeContent}
          setActiveContent={setActiveContent}
          onStartQuiz={(quizId) => {
            setCurrentQuizContentId(quizId);
            setShowQuiz(true);
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center h-16 px-6 border-b gap-4 shrink-0">
          <SidebarTrigger onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
          <h1 className="text-xl font-semibold">{course.title}</h1>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {showQuiz && currentQuizContentId ? (
            <Quiz
              courseId={course.id}
              contentId={currentQuizContentId}
              onComplete={handleQuizComplete}
              onCancel={handleQuizCancel}
            />
          ) : selectedLecture ? (
            <LectureContent
              lecture={selectedLecture}
              onNext={handleNext}
              onPrevious={handlePrevious}
              hasNext
              hasPrevious
              onMarkComplete={markLectureComplete}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="bg-primary/10 p-6 rounded-full mb-4">
                <BookOpen className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Welcome to {course.title}
              </h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Select a lecture from the sidebar to begin your learning journey.
              </p>
              <Button
                onClick={() => {
                  setSelectedLecture(course.contents[0]?.lectures[0]);
                  setActiveContent(course.contents[0]?.id || "");
                }}
                className="gap-2"
              >
                <PlayCircle className="h-4 w-4" />
                Start First Lesson
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
