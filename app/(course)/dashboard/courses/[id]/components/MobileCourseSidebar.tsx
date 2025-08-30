// components/MobileCourseSidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Home, 
  BookOpen, 
  BarChart3, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle,
  PlayCircle,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { useUser } from "@clerk/nextjs";

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

interface MobileCourseSidebarProps {
  course: CourseResponse;
  selectedLecture: Lecture | null;
  setSelectedLecture: (lecture: Lecture) => void;
  activeContent: string;
  setActiveContent: (contentId: string) => void;
  onStartQuiz: (quizId: string) => void;
}

export default function MobileCourseSidebar({
  course,
  selectedLecture,
  setSelectedLecture,
  activeContent,
  setActiveContent,
  onStartQuiz
}: MobileCourseSidebarProps) {
  const { user } = useUser();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  
  const toggleSection = (contentId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [contentId]: !prev[contentId]
    }));
  };

  return (
    <div className="h-full bg-background flex flex-col">
      {/* User Profile Section */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.fullName}</p>
            <p className="text-sm text-muted-foreground truncate">
              {user?.emailAddresses[0]?.emailAddress}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/courses">
              <BookOpen className="h-4 w-4 mr-2" />
              Your Courses
            </Link>
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <BarChart3 className="h-4 w-4 mr-2" />
            Progress Track
          </Button>
        </div>
      </div>

      {/* Course Progress */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Course Progress</span>
          <span className="text-sm text-muted-foreground">
            {course.progress || 0}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${course.progress || 0}%` }}
          />
        </div>
      </div>

      {/* Course Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <h3 className="font-semibold mb-4">Course Content</h3>
          <div className="space-y-2">
            {course.contents.map((content) => (
              <Collapsible 
                key={content.id}
                open={openSections[content.id] ?? true}
                onOpenChange={() => toggleSection(content.id)}
                className="border rounded-lg"
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium",
                        activeContent === content.id 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {content.order}
                      </div>
                      <span className="font-medium text-sm">
                        {content.title}
                      </span>
                    </div>
                    {openSections[content.id] ?? true ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-10 pr-3 pb-3 space-y-2">
                    {content.lectures.map((lecture) => (
                      <div
                        key={lecture.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                          selectedLecture?.id === lecture.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => {
                          setSelectedLecture(lecture);
                          setActiveContent(content.id);
                        }}
                      >
                        {lecture.completed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <PlayCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm flex-1">
                          {lecture.title}
                        </span>
                        {lecture.duration && (
                          <span className="text-xs text-muted-foreground">
                            {Math.floor(lecture.duration / 60)}:
                            {(lecture.duration % 60).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>
                    ))}
                    
                    {content.hasQuiz && (
                      <div
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                          content.quizCompleted
                            ? "text-green-500"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => {
                          if (content.quizId) {
                            onStartQuiz(content.quizId);
                          }
                        }}
                      >
                        <HelpCircle className="h-4 w-4" />
                        <span className="text-sm flex-1">Quiz</span>
                        {content.quizCompleted && (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}