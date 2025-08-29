"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookOpen, PlayCircle, GraduationCap ,ChevronLeft,ChevronRight,ChevronDown} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import CourseSidebar from "./components/CourseSidebar";
import LectureContent from "./components/LectureContent";
import Quiz from "./components/Quiz";
interface Lecture {
  id: string;
  title: string;
  summary?: string;
  videoUrl?: string;
  pdfUrl?: string;
  order: number;
  duration?: number;
  completed?: boolean;
}

interface Content {
  id: string;
  title: string;
  order: number;
  lectures: Lecture[];
  hasQuiz: boolean;
  quizId: string | null;
  quizCompleted?: boolean;
}

interface CourseResponse {
  id: string;
  title: string;
  description: string;
  contents: Content[];
  progress?: number;
}

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const { theme } = useTheme();

  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [activeContent, setActiveContent] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/courses/${courseId}/contents`, {
          credentials: "include",
        });
        const json = await res.json();

        if (res.ok) {
          setCourse(json);
          if (json.contents?.[0]?.lectures?.[0]) {
            setSelectedLecture(json.contents[0].lectures[0]);
            setActiveContent(json.contents[0].id);
          }
          setError(null);
        } else {
          console.error("Error:", json.error);
          setError(json.error || "Failed to load course");
        }
      } catch (err) {
        console.error("Network error:", err);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  // Mark lecture as completed
  const markAsComplete = async (lectureId: string) => {
    // In a real app, you would make an API call here
    console.log("Marking lecture as complete:", lectureId);
    
    // Update local state for demo purposes
    if (course && selectedLecture) {
      const updatedCourse = { ...course };
      const lecture = updatedCourse.contents
        .flatMap(c => c.lectures)
        .find(l => l.id === lectureId);
      
      if (lecture) {
        lecture.completed = true;
        setCourse(updatedCourse);
        
        // Update progress
        const completedLectures = updatedCourse.contents
          .flatMap(c => c.lectures)
          .filter(l => l.completed).length;
        
        const totalLectures = updatedCourse.contents.reduce(
          (total, content) => total + content.lectures.length,
          0
        );
        
        updatedCourse.progress = Math.round(
          (completedLectures / totalLectures) * 100
        );
        
        setCourse(updatedCourse);
      }
    }
  };

  // Navigation functions
  const goToNextLecture = () => {
    if (!course || !selectedLecture) return;
    
    // Find the current lecture index
    let nextLecture: Lecture | null = null;
    let foundCurrent = false;
    
    for (const content of course.contents) {
      for (const lecture of content.lectures) {
        if (foundCurrent) {
          nextLecture = lecture;
          break;
        }
        if (lecture.id === selectedLecture.id) {
          foundCurrent = true;
        }
      }
      if (nextLecture) break;
    }
    
    if (nextLecture) {
      setSelectedLecture(nextLecture);
      setShowQuiz(false);
    }
  };

  const goToPreviousLecture = () => {
    if (!course || !selectedLecture) return;
    
    // Find the previous lecture
    let prevLecture: Lecture | null = null;
    let lastLecture: Lecture | null = null;
    
    for (const content of course.contents) {
      for (const lecture of content.lectures) {
        if (lecture.id === selectedLecture.id) {
          if (lastLecture) {
            setSelectedLecture(lastLecture);
            setShowQuiz(false);
          }
          return;
        }
        lastLecture = lecture;
      }
    }
  };

  // Check if next/previous lectures exist
  const hasNextLecture = () => {
    if (!course || !selectedLecture) return false;
    
    let foundCurrent = false;
    
    for (const content of course.contents) {
      for (const lecture of content.lectures) {
        if (foundCurrent) return true;
        if (lecture.id === selectedLecture.id) {
          foundCurrent = true;
        }
      }
    }
    
    return false;
  };

  const hasPreviousLecture = () => {
    if (!course || !selectedLecture) return false;
    
    let lastLecture: Lecture | null = null;
    
    for (const content of course.contents) {
      for (const lecture of content.lectures) {
        if (lecture.id === selectedLecture.id) {
          return lastLecture !== null;
        }
        lastLecture = lecture;
      }
    }
    
    return false;
  };

  // Handle quiz start
  const startQuiz = (quizId: string) => {
    setCurrentQuizId(quizId);
    setShowQuiz(true);
  };

  // Handle quiz completion
  const handleQuizComplete = (score: number, total: number) => {
    console.log(`Quiz completed! Score: ${score}/${total}`);
    
    // Update quiz completion status in the course data
    if (course && currentQuizId) {
      const updatedCourse = { ...course };
      
      // Find the content that has this quiz
      for (const content of updatedCourse.contents) {
        if (content.quizId === currentQuizId) {
          content.quizCompleted = true;
          break;
        }
      }
      
      setCourse(updatedCourse);
    }
    
    // Return to lecture view
    setShowQuiz(false);
    setCurrentQuizId(null);
  };

  // Handle quiz cancel
  const handleQuizCancel = () => {
    setShowQuiz(false);
    setCurrentQuizId(null);
  };

  // ⏳ Loading state
  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <aside className="w-80 border-r p-4 bg-muted/20">
          <Skeleton className="h-8 w-3/4 mb-6" />
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-2/3 mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-6" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="mb-4">
              <Skeleton className="h-6 w-2/3 mb-2" />
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-10 w-full mb-2 rounded-lg" />
              ))}
            </div>
          ))}
        </aside>
        <main className="flex-1 p-6">
          <Skeleton className="h-10 w-1/2 mb-6" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  // ❌ Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-destructive/10 p-3 rounded-full">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl">Error Loading Course</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 🛑 No course found
  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Course Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              The requested course could not be found.
            </p>
            <Button onClick={() => (window.location.href = "/courses")}>
              Browse Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Loaded
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-4 top-4 z-40 rounded-md p-2 bg-primary text-primary-foreground shadow-md lg:hidden"
      >
        {sidebarOpen ? <ChevronDown /> : <ChevronRight />}
      </button>

      {/* Sidebar */}
      <CourseSidebar
        course={course}
        selectedLecture={selectedLecture}
        setSelectedLecture={setSelectedLecture}
        activeContent={activeContent}
        setActiveContent={setActiveContent}
        sidebarOpen={sidebarOpen}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-gradient-to-b from-slate-900 to-slate-800">
        {showQuiz && currentQuizId ? (
          <Quiz 
            quizId={currentQuizId}
            onComplete={handleQuizComplete}
            onCancel={handleQuizCancel}
          />
        ) : selectedLecture ? (
          <LectureContent 
            lecture={selectedLecture}
            onNext={goToNextLecture}
            onPrevious={goToPreviousLecture}
            hasNext={hasNextLecture()}
            hasPrevious={hasPreviousLecture()}
            onMarkComplete={markAsComplete}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-white">
            <div className="bg-slate-700 p-6 rounded-full mb-4">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Welcome to {course.title}</h2>
            <p className="text-slate-300 max-w-md mb-6">
              Select a lecture from the sidebar to begin your learning journey.
            </p>
            <Button 
              onClick={() => setSelectedLecture(course.contents[0]?.lectures[0])}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <PlayCircle className="h-4 w-4" />
              Start First Lesson
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}