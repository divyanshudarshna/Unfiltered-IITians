"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookOpen, PlayCircle, Bell, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import CourseSidebar from "./components/CourseSidebar";
import LectureContent from "./components/LectureContent";
import Quiz from "./components/Quiz";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCourse } from "@/app/contexts/CourseContext";
import { Announcements, Notification } from "./components/Announcements";
import { useAuth } from "@clerk/nextjs";
import { FeedbackModal } from "./components/FeedbackModal";

export default function CourseDetailPageContent() {
  const { course, selectedLecture, activeContent, setSelectedLecture, setActiveContent, loading, error, saveProgress, markLectureComplete } = useCourse();
  const { getToken } = useAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizContentId, setCurrentQuizContentId] = useState<string | null>(null);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoadingLecture, setIsLoadingLecture] = useState(false);

  // Notifications & unread
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  /** Fetch notifications from both announcements & feedback replies */
  const fetchNotifications = useCallback(async () => {
    if (!course) return;
    try {
      const token = await getToken();
      if (!token) return;

      const [annRes, fbRes] = await Promise.all([
        fetch(`/api/announcements?courseId=${course.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/feedback/reply`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const annData = await annRes.json();
      const fbData = await fbRes.json();

      const announcements: Notification[] = Array.isArray(annData.announcements)
        ? annData.announcements.map((a: any) => ({
            id: a.id,
            title: a.title,
            message: a.message,
            createdAt: a.createdAt,
            read: a.read ?? false,
            type: "announcement",
            announcementId: a.id,
          }))
        : [];

      const feedbackReplies: Notification[] = fbData.feedbacks?.flatMap((f: any) =>
        f.replies?.map((r: any) => ({
          id: `feedback-${r.id}`,
          title: "Reply from admin to your feedback",
          message: r.message,
          createdAt: r.createdAt,
          read: r.recipient?.read ?? false,
          type: "feedback",
          replyId: r.id,
        }))
      ) ?? [];

      const merged = [...announcements, ...feedbackReplies].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(merged);
      setUnreadCount(merged.filter((n) => !n.read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [course, getToken]);

  /** Auto-mark all notifications as read when announcements modal opens */
  const markAllAsRead = useCallback(async () => {
    if (!course || notifications.length === 0) return;
    const token = await getToken();
    if (!token) return;

    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) return;

    try {
      await Promise.all(
        unread.map((n) => {
          if (n.type === "announcement" && n.announcementId) {
            return fetch("/api/announcements/read", {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ announcementId: n.announcementId }),
            });
          } else if (n.type === "feedback" && n.replyId) {
            return fetch("/api/feedback/read", {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ replyId: n.replyId }),
            });
          }
          return Promise.resolve();
        })
      );

      // Update local state & badge
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  }, [course, notifications, getToken]);

  // Fetch notifications when course loads
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Refresh notifications when lecture changes
  useEffect(() => {
    fetchNotifications();
  }, [selectedLecture?.id, fetchNotifications]);

  // Refresh notifications when quiz is completed
  useEffect(() => {
    if (!showQuiz) {
      fetchNotifications();
    }
  }, [showQuiz, fetchNotifications]);

  // Mark as read automatically when modal opens
  useEffect(() => {
    if (showAnnouncements) {
      markAllAsRead();
    }
  }, [showAnnouncements, markAllAsRead]);

  /** Helper to find lecture position in course contents */
  const findLecturePosition = () => {
    if (!course || !selectedLecture) return null;
    for (let ci = 0; ci < course.contents.length; ci++) {
      const content = course.contents[ci];
      const li = content.lectures.findIndex((l) => l.id === selectedLecture.id);
      if (li !== -1) return { ci, li };
    }
    return null;
  };

  /** Navigation handlers */
  const handleNext = async () => {
    if (!course || !selectedLecture || isLoadingLecture) return;
    
    setIsLoadingLecture(true);
    try {
      const pos = findLecturePosition();
      if (!pos) return;
      const { ci, li } = pos;
      const currentContent = course.contents[ci];

      if (li + 1 < currentContent.lectures.length) {
        // Mark current lecture as complete before moving to next
        await markLectureComplete(selectedLecture.id);
        setSelectedLecture(currentContent.lectures[li + 1]);
        return;
      }

      if (currentContent.hasQuiz && !currentContent.quizCompleted) {
        // Mark current lecture as complete before showing quiz
        await markLectureComplete(selectedLecture.id);
        setCurrentQuizContentId(currentContent.id);
        setShowQuiz(true);
        return;
      }

      if (ci + 1 < course.contents.length) {
        // Mark current lecture as complete before moving to next module
        await markLectureComplete(selectedLecture.id);
        const nextContent = course.contents[ci + 1];
        if (nextContent.lectures.length > 0) {
          setSelectedLecture(nextContent.lectures[0]);
          setActiveContent(nextContent.id);
        }
      }
    } catch (error) {
      console.error("Error navigating to next lecture:", error);
    } finally {
      setIsLoadingLecture(false);
    }
  };

  const handlePrevious = async () => {
    if (!course || !selectedLecture || isLoadingLecture) return;
    
    setIsLoadingLecture(true);
    try {
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
    } catch (error) {
      console.error("Error navigating to previous lecture:", error);
    } finally {
      setIsLoadingLecture(false);
    }
  };

  /** Quiz handlers */
  const handleQuizComplete = async (score: number, total: number) => {
    if (course && currentQuizContentId) {
      await saveProgress(currentQuizContentId, true, score, total);
    }
    setShowQuiz(false);
    setCurrentQuizContentId(null);
  };

  const handleQuizCancel = () => {
    setShowQuiz(false);
    setCurrentQuizContentId(null);
  };

  const handleLectureSelect = async (lecture: any, contentId: string) => {
    if (isLoadingLecture) return;
    
    setIsLoadingLecture(true);
    try {
      setSelectedLecture(lecture);
      setActiveContent(contentId);
      
      // Simulate loading time for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error("Error selecting lecture:", error);
    } finally {
      setIsLoadingLecture(false);
    }
  };

  /** Render loading skeleton */
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

  /** Render error state */
  if (error || !course) {
    return (
      <div className="flex h-screen items-center justify-center text-center p-6">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {error ? "Error Loading Course" : "Course Not Found"}
        </h2>
        <p className="text-muted-foreground mb-4">
          {error || "The requested course could not be found."}
        </p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "h-full border-r overflow-hidden transition-[width,opacity] duration-300 ease-in-out",
          isSidebarCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-[350px] opacity-100"
        )}
      >
        <CourseSidebar
          course={course}
          selectedLecture={selectedLecture}
          setSelectedLecture={(lecture) => {
            const content = course.contents.find(c => 
              c.lectures.some(l => l.id === lecture.id)
            );
            if (content) {
              handleLectureSelect(lecture, content.id);
            }
          }}
          activeContent={activeContent}
          setActiveContent={setActiveContent}
          onStartQuiz={(quizId) => {
            setCurrentQuizContentId(quizId);
            setShowQuiz(true);
          }}
          isLoadingLecture={isLoadingLecture}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center h-16 px-6 border-b gap-4 justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
            <h1 className="text-xl font-semibold">{course.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Announcements */}
            <Button
              variant="ghost"
              onClick={() => setShowAnnouncements(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out"
            >
              <Bell className="h-5 w-5" />
              <span className="font-medium text-sm md:text-base">Announcements</span>
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white shadow-md">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>

            {/* Feedback */}
            <Button
              variant="ghost"
              onClick={() => setShowFeedback(true)}
              className="relative p-2 hover:bg-blue-500/10 transition-all rounded-md"
            >
              Submit Question
            </Button>
          </div>
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
              hasNext={!!findNextLecture()}
              hasPrevious={!!findPreviousLecture()}
              onMarkComplete={markLectureComplete}
              isLoading={isLoadingLecture}
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
                  const firstContent = course.contents[0];
                  if (firstContent && firstContent.lectures.length > 0) {
                    handleLectureSelect(firstContent.lectures[0], firstContent.id);
                  }
                }}
                className="gap-2"
                disabled={isLoadingLecture}
              >
                {isLoadingLecture ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
                Start First Lesson
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Announcements modal */}
      <Announcements
        courseId={course.id}
        open={showAnnouncements}
        onOpenChange={setShowAnnouncements}
        notifications={notifications}
        setNotifications={setNotifications}
      />

      {/* Feedback modal */}
      <FeedbackModal
        courseId={course.id}
        open={showFeedback}
        onOpenChange={setShowFeedback}
        onSuccess={() => {
          fetchNotifications(); // refresh badge after new feedback
        }}
      />
    </div>
  );

  // Helper functions to determine next/previous lecture availability
  function findNextLecture() {
    if (!course || !selectedLecture) return null;
    
    const pos = findLecturePosition();
    if (!pos) return null;
    const { ci, li } = pos;
    const currentContent = course.contents[ci];

    if (li + 1 < currentContent.lectures.length) {
      return currentContent.lectures[li + 1];
    }

    if (currentContent.hasQuiz && !currentContent.quizCompleted) {
      return { isQuiz: true, contentId: currentContent.id };
    }

    if (ci + 1 < course.contents.length) {
      const nextContent = course.contents[ci + 1];
      if (nextContent.lectures.length > 0) {
        return nextContent.lectures[0];
      }
    }

    return null;
  }

  function findPreviousLecture() {
    if (!course || !selectedLecture) return null;
    
    const pos = findLecturePosition();
    if (!pos) return null;
    const { ci, li } = pos;

    if (li > 0) {
      return course.contents[ci].lectures[li - 1];
    }

    if (ci > 0) {
      const prevContent = course.contents[ci - 1];
      if (prevContent.hasQuiz && !prevContent.quizCompleted) {
        return { isQuiz: true, contentId: prevContent.id };
      }
      if (prevContent.lectures.length > 0) {
        return prevContent.lectures[prevContent.lectures.length - 1];
      }
    }

    return null;
  }
}