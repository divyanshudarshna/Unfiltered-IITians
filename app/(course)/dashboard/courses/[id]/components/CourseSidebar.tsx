"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  FileText,
  Video,
  CheckCircle2,
  Clock,
  BarChart3,
  Target,
  FileQuestion,
  Award,
  ChevronDown,
  Play,
  Lock,
  Star,
  Crown,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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

interface CourseSidebarProps {
  course: CourseResponse;
  selectedLecture: Lecture | null;
  setSelectedLecture: (lecture: Lecture) => void;
  activeContent: string;
  setActiveContent: (contentId: string) => void;
  sidebarOpen: boolean;
}

export default function CourseSidebar({
  course,
  selectedLecture,
  setSelectedLecture,
  activeContent,
  setActiveContent,
  sidebarOpen,
}: CourseSidebarProps) {
  // Format time in minutes to readable format
  const formatDuration = (minutes?: number) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Calculate total course duration
  const totalDuration = course.contents.reduce((total, content) => {
    const contentDuration = content.lectures.reduce(
      (sum, lecture) => sum + (lecture.duration || 0),
      0
    );
    return total + contentDuration;
  }, 0);

  // Get icon based on lecture type
  const getLectureIcon = (lecture: Lecture) => {
    if (lecture.videoUrl) return <Video className="h-3.5 w-3.5 mr-2 text-blue-400" />;
    if (lecture.pdfUrl) return <FileText className="h-3.5 w-3.5 mr-2 text-purple-400" />;
    return <BookOpen className="h-3.5 w-3.5 mr-2 text-green-400" />;
  };

  // Calculate total lectures count
  const totalLectures = course.contents.reduce(
    (total, content) => total + content.lectures.length,
    0
  );

  // Calculate completed lectures count
  const completedLectures = course.contents.reduce(
    (total, content) => total + content.lectures.filter(lec => lec.completed).length,
    0
  );

  return (
    <aside
      className={cn(
        "w-80 border-r bg-gradient-to-br from-slate-900 to-slate-800 p-5 flex flex-col transition-all duration-300 z-30 shadow-xl",
        sidebarOpen ? "translate-x-0" : "-translate-x-full absolute lg:translate-x-0 lg:relative"
      )}
    >
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">{course.title}</h2>
        </div>
        
        <p className="text-sm text-slate-300 mb-5 line-clamp-2">
          {course.description}
        </p>
        
        {/* Progress Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Your progress</span>
            <span className="text-sm font-medium text-white">{course.progress || 0}%</span>
          </div>
          <Progress value={course.progress || 0} className="h-2 mb-3 bg-slate-700" />
          
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{completedLectures}/{totalLectures} completed</span>
            <span>{formatDuration(totalDuration)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-800/30 rounded-lg p-2">
            <BarChart3 className="h-4 w-4 mx-auto text-blue-400 mb-1" />
            <span className="text-xs text-slate-300">{course.contents.length}</span>
            <p className="text-[10px] text-slate-400">Sections</p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-2">
            <Target className="h-4 w-4 mx-auto text-purple-400 mb-1" />
            <span className="text-xs text-slate-300">{totalLectures}</span>
            <p className="text-[10px] text-slate-400">Lectures</p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-2">
            <Clock className="h-4 w-4 mx-auto text-green-400 mb-1" />
            <span className="text-xs text-slate-300">{Math.ceil(totalDuration / 60)}h</span>
            <p className="text-[10px] text-slate-400">Total</p>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <ScrollArea className="flex-1 pr-3">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-yellow-400" />
          Course Content
        </h3>
        
        <Accordion
        type="single"
          collapsible
          value={activeContent}
          onValueChange={setActiveContent}
          className="w-full"
        >
          {course.contents.map((content) => (
            <AccordionItem 
              key={content.id} 
              value={content.id} 
              className="border-none mb-3"
            >
              <AccordionTrigger className="py-3 hover:no-underline rounded-xl px-3 hover:bg-slate-700/30 transition-all group">
                <div className="flex items-center w-full">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                    <span className="text-xs font-bold text-white">
                      {content.order}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
                      {content.title}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {content.lectures.length} lessons • {formatDuration(content.lectures.reduce((sum, l) => sum + (l.duration || 0), 0))}
                    </p>
                  </div>
                  {/* <ChevronDown className="h-4 w-4 text-slate-400 ml-auto transition-transform group-data-[state=open]:rotate-180" /> */}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-2">
                <div className="space-y-1.5 pl-6 mt-2 border-l-2 border-slate-700/50">
                  {content.lectures.map((lec) => (
                    <Button
                      key={lec.id}
                      variant={
                        selectedLecture?.id === lec.id ? "secondary" : "ghost"
                      }
                      className={cn(
                        "w-full justify-start text-sm font-normal h-9 transition-all group/lecture rounded-lg px-3",
                        selectedLecture?.id === lec.id
                          ? "bg-blue-500/20 text-blue-100 border border-blue-500/30 shadow-md"
                          : "hover:bg-slate-700/40 text-slate-200 border border-transparent"
                      )}
                      onClick={() => setSelectedLecture(lec)}
                    >
                      <div className="flex items-center w-full">
                        {lec.completed ? (
                          <div className="relative">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-400 flex-shrink-0" />
                          </div>
                        ) : (
                          <span className="flex-shrink-0">
                            {getLectureIcon(lec)}
                          </span>
                        )}
                        <span className="truncate text-left flex-1">{lec.order}. {lec.title}</span>
                        {lec.duration && (
                          <Badge
                            variant="secondary"
                            className="ml-auto text-xs font-normal flex-shrink-0 bg-slate-700/50 text-slate-300"
                          >
                            {Math.floor(lec.duration / 60)}:{String(lec.duration % 60).padStart(2, '0')}
                          </Badge>
                        )}
                        {selectedLecture?.id === lec.id && (
                          <Play className="h-3 w-3 ml-2 text-blue-400 animate-pulse" />
                        )}
                      </div>
                    </Button>
                  ))}
                  
                  {content.hasQuiz && (
                    <>
                      <Separator className="my-2 bg-slate-700/50" />
                      <Button
                        variant={
                          content.quizCompleted ? "outline" : "default"
                        }
                        className="w-full justify-start text-sm h-9 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
                        onClick={() =>
                          alert(`TODO: Load quiz ${content.quizId}`)
                        }
                      >
                        <FileQuestion className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                        Section Quiz
                        {content.quizCompleted && (
                          <CheckCircle2 className="h-3.5 w-3.5 ml-2 text-green-300 flex-shrink-0" />
                        )}
                        <Badge
                          variant="secondary"
                          className="ml-auto text-xs font-normal flex-shrink-0 bg-white/20 text-white"
                        >
                          Test
                        </Badge>
                      </Button>
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>

      {/* Footer Section */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-400">Course Completion</span>
          <span className="font-medium text-white">{course.progress || 0}%</span>
        </div>
        <Progress value={course.progress || 0} className="h-1.5 mb-4 bg-slate-700" />
        
        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-md">
          <Crown className="h-4 w-4 mr-2" />
          Get Certificate
        </Button>
        
        <div className="text-xs text-center text-slate-400 mt-3">
          Complete all lessons and quizzes to unlock your certificate
        </div>
      </div>
    </aside>
  );
}