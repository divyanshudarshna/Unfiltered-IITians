"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { format } from "date-fns";
import { Bell, CheckCheck, Calendar, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function Announcements({
  courseId,
  open,
  onOpenChange,
  onMarkAsRead,
}: {
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAsRead?: () => void;
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setAnnouncements([]);
        return;
      }

      const response = await fetch(`/api/announcements?courseId=${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setAnnouncements([]);
        return;
      }

      const data = await response.json();
      setAnnouncements(Array.isArray(data.announcements) ? data.announcements : []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (announcementId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ announcementId }),
      });

      setAnnouncements((prev) =>
        prev.map((a) => (a.id === announcementId ? { ...a, read: true } : a))
      );

      if (onMarkAsRead) onMarkAsRead();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  useEffect(() => {
    if (open) fetchAnnouncements();
  }, [open]);

  useEffect(() => {
    if (open && announcements.length > 0) {
      const unread = announcements.filter((a) => !a.read);
      if (unread.length === 0) return;

      const timer = setTimeout(() => {
        unread.forEach((a) => markAsRead(a.id));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [open, announcements]);

  // Scroll to bottom for chat-like view
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [announcements]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full bg-slate-900 dark:bg-gray-900 p-0 rounded-xl shadow-2xl border-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-500 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Course Announcements
            </DialogTitle>
            <Badge variant="outline" className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {announcements.length} {announcements.length === 1 ? 'Announcement' : 'Announcements'}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[28rem] px-4 py-2 bg-gray-50/50 dark:bg-slate-950/30" ref={scrollRef}>
          <div className="flex flex-col space-y-4 py-2">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))
              : announcements.length === 0
              ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                    <Bell className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">
                    No announcements yet
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    New announcements will appear here
                  </p>
                </div>
              )
              : announcements.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      "flex flex-col p-4 rounded-xl transition-all duration-200 border",
                      a.read 
                        ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm" 
                        : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 shadow-md"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={cn(
                        "font-bold text-lg md:text-lg",
                        a.read 
                          ? "text-gray-800 dark:text-gray-200" 
                          : "text-blue-700 dark:text-blue-400"
                      )}>
                        {a.title}
                      </h3>
                      {!a.read && (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50">
                          New
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                      {a.message}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(a.createdAt), "MMM d, yyyy")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(a.createdAt), "h:mm a")}
                        </div>
                      </div>
                      
                      {a.read ? (
                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <CheckCheck className="h-3.5 w-3.5" />
                          Read
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          Unread
                        </div>
                      )}
                    </div>
                  </div>
                ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}