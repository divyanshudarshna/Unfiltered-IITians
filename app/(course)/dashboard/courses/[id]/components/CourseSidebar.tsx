"use client";

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  PlayCircle, 
  HelpCircle,

  BookText,
  Home,
  BookOpen,
  Target,
  Award,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

// Types...

export default function CourseSidebar({
  course,
  selectedLecture,
  setSelectedLecture,
  activeContent,
  setActiveContent,
  onStartQuiz,
}: CourseSidebarProps) {
  const [user, setUser] = useState<any>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/user");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    }
    fetchUser();
  }, []);

  if (!course) return null;

  const toggleSection = (contentId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [contentId]: !prev[contentId],
    }));
  };

  // Progress
  const { progress, completedItems, totalItems } = useMemo(() => {
    let completed = 0;
    let total = 0;

    course.contents.forEach((content: any) => {
      content.lectures.forEach((lecture: any) => {
        total++;
        if (lecture.completed) completed++;
      });
      if (content.hasQuiz) {
        total++;
        if (content.quizCompleted) completed++;
      }
    });

    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { progress, completedItems: completed, totalItems: total };
  }, [course]);

  const totalDuration = useMemo(() => {
    return course.contents.reduce((total: number, content: any) => {
      return (
        total +
        content.lectures.reduce((lectureTotal: number, lecture: any) => {
          return lectureTotal + (lecture.duration || 0);
        }, 0)
      );
    }, 0);
  }, [course]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background to-muted/30 ">
      {/* USER HEADER */}
      <SidebarHeader className="p-5 border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-3">
        {user?.profileImageUrl ? (
  <div className="relative h-12 w-12">
    <Image
      src={user.profileImageUrl}
      alt="avatar"
      fill
      sizes="48px"
      className="rounded-full object-cover border shadow-sm"
      priority
    />
  </div>
) : (

  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
    {user?.name?.[0]}
  </div>

)}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-sm">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </SidebarHeader>

      {/* NAVIGATION */}
      <SidebarContent className="flex-1 ">
        <SidebarGroup className="mt-2">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2  flex-row">
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="rounded-lg hover:bg-primary/10 hover:text-primary transition">
                  <Link href="/" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
                  <SidebarMenuItem>
                <SidebarMenuButton asChild className="rounded-lg hover:bg-primary/10 hover:text-primary transition">
                  <Link href="/dashboard/courses" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>My Courses</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>


                <SidebarMenuButton asChild className="rounded-lg hover:bg-primary/10 hover:text-primary transition">
                  <Link href="/courses" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>All Courses</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* PROGRESS */}
        <div className="p-4 border-y bg-muted/40">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Progress</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {progress}%
              </Badge>
            </div>
            <Progress value={progress} className="h-2 bg-muted" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{completedItems}/{totalItems} done</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(totalDuration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* COURSE CONTENT */}
       {/* COURSE CONTENT */}
<SidebarGroup className="mt-4 ">
  <SidebarGroupLabel className="flex items-center gap-2 px-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">
    <BookText className="h-4 w-4 text-cyan-500" />
    Course Content
  </SidebarGroupLabel>
  <SidebarGroupContent>
    <ScrollArea className="h-[calc(100vh-360px)] px-2">
      <div className="space-y-3">
        {course.contents.map((content: any, idx: number) => {
          const contentCompleted =
            content.lectures.every((l: any) => l.completed) &&
            (!content.hasQuiz || content.quizCompleted);

          return (
            <Collapsible
              key={content.id}
              open={openSections[content.id] ?? true}
              onOpenChange={() => toggleSection(content.id)}
              className="rounded-xl border border-border bg-muted/40 dark:bg-zinc-900/60 shadow-md hover:shadow-cyan-500/20 transition-all duration-300"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between h-auto p-4 hover:bg-cyan-500/10 hover:scale-[1.01] transition-transform",
                    activeContent === content.id &&
                      "bg-cyan-500/20 ring-1 ring-cyan-500/50"
                  )}
                >
                  <div className="flex items-center gap-3 text-left flex-1">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-xs font-medium border-2 shrink-0 transition-all shadow-sm",
                        activeContent === content.id
                          ? "bg-amber-500 text-white border-amber-400 shadow-amber-500/40"
                          : contentCompleted
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-400/40 shadow-emerald-500/30"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      )}
                    >
                      {`Ch ${idx + 1}`}
                    </div>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="font-medium text-sm truncate">
                        {content.title}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{content.lectures.length} lessons</span>
                        {content.hasQuiz && <span>• Quiz</span>}
                      </div>
                    </div>
                  </div>
                  {openSections[content.id] ?? true ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="pl-14 pr-3 pb-3 space-y-2">
                  {content.lectures.map((lecture: any) => (
                    <Button
                      key={lecture.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-auto p-3 rounded-lg transition-all duration-200 hover:bg-cyan-500/10 hover:shadow-cyan-500/20 hover:scale-[1.01]",
                        selectedLecture?.id === lecture.id &&
                          "bg-cyan-500/20 font-medium ring-1 ring-cyan-400"
                      )}
                      onClick={() => {
                        setSelectedLecture(lecture);
                        setActiveContent(content.id);
                      }}
                    >
                      {lecture.completed ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400 mr-3 shrink-0" />
                      ) : (
                        <PlayCircle className="h-4 w-4 text-muted-foreground mr-3 shrink-0" />
                      )}
                      <span className="text-sm flex-1 text-left truncate">
                        {lecture.title}
                      </span>
                    </Button>
                  ))}

                  {content.hasQuiz && (
                 <Button
  variant="ghost"
  className={cn(
    "w-full justify-start h-auto p-3 rounded-lg border transition-colors hover:bg-amber-500/10 hover:border-amber-400/40 hover:shadow-amber-500/30",
    content.quizCompleted
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-400/40 shadow-emerald-500/20"
      : "text-muted-foreground border-border"
  )}
  onClick={() => onStartQuiz(content.id)}   // 👈 FIXED: use content.id not content.quizId
>
  <Award className="h-4 w-4 mr-3 shrink-0" />
  <span className="text-sm flex-1 text-left">Module Quiz</span>
  {content.quizCompleted && (
    <Badge
      variant="secondary"
      className="ml-2 bg-emerald-500/20 text-emerald-400 border border-emerald-400/40"
    >
      Completed
    </Badge>
  )}
</Button>

                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </ScrollArea>
  </SidebarGroupContent>
</SidebarGroup>


      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="p-4 border-t bg-muted/40">
        <div className="text-xs text-center text-muted-foreground">
          <p className="flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" />
            Progress auto-saves as you learn
          </p>
        </div>
      </SidebarFooter>
    </div>
  );
}
