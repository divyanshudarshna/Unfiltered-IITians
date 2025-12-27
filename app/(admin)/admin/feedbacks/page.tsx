"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { format } from "date-fns";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Trash2, 
  MessageCircle, 
  RefreshCw, 
  Search,
  Clock,
  User,
  Send,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  X,
  MoreVertical,
  ChevronRight,
  Menu
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Feedback {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  user: { 
    id: string; 
    name: string; 
    email: string; 
    profileImageUrl?: string;
  };
  course: {
    id: string;
    title: string;
    description?: string;
  };
  replies: {
    id: string;
    message: string;
    createdAt: string;
    admin: { id: string; name: string };
  }[];
}

export default function FeedbacksPage() {
  const { getToken } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [quickReplyText, setQuickReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [markingRead, setMarkingRead] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch unread feedback count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch("/api/admin/feedback/unread-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch unread count");

      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
      setUnreadCount(0);
    }
  }, [getToken]);

  // Fetch feedbacks from API
  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch("/api/admin/feedback", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch feedbacks");

      const data = await res.json();
      const newFeedbacks = data.feedbacks || [];
      setFeedbacks(newFeedbacks);
      
      // Auto-select the first unread feedback's course if no course is selected
      if (!selectedCourse && newFeedbacks.length > 0) {
        const firstUnread = newFeedbacks.find((f: Feedback) => 
          f.status === "PENDING" && f.replies.length === 0
        );
        if (firstUnread) {
          setSelectedCourse(firstUnread.course.id);
        }
      }
      
      // Also fetch unread count
      await fetchUnreadCount();
    } catch (err) {
      console.error(err);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  }, [getToken, fetchUnreadCount]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Scroll to bottom when course changes or feedbacks update
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 100);
      }
    }
  }, []);

  // Submit reply to selected feedback
  const submitReply = async (feedbackId: string, message: string) => {
    if (!message.trim()) return;
    setSubmittingReply(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          feedbackId,
          message,
        }),
      });
      if (!res.ok) throw new Error("Failed to send reply");

      setQuickReplyText("");
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
      alert("Error sending reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  // Mark feedback as read
  const markAsRead = async (feedbackId: string) => {
    setMarkingRead(feedbackId);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/feedback/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ feedbackId }),
      });
      if (!res.ok) throw new Error("Failed to mark as read");

      setFeedbacks(prev => 
        prev.map(f => f.id === feedbackId ? { ...f, status: "RESOLVED" } : f)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      await fetchFeedbacks();
    } catch (err) {
      console.error(err);
      alert("Error marking feedback as read");
    } finally {
      setMarkingRead(null);
    }
  };

  // Mark all feedbacks as read
  const markAllAsRead = async () => {
    setMarkingAllRead(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/feedback/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ markAll: true }),
      });
      if (!res.ok) throw new Error("Failed to mark all as read");

      setFeedbacks(prev => 
        prev.map(f => f.status === "PENDING" ? { ...f, status: "RESOLVED" } : f)
      );
      setUnreadCount(0);
      await fetchFeedbacks();
    } catch (err) {
      console.error(err);
      alert("Error marking all feedbacks as read");
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Delete entire feedback
  const deleteFeedback = async (feedbackId: string) => {
    if (!confirm("Are you sure you want to delete this feedback and all its replies?")) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Failed to delete feedback");
      }
      alert("Feedback deleted successfully!");
      fetchFeedbacks();
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error deleting feedback");
    }
  };

  // Filter feedbacks based on search, status, and selected course
  const filteredFeedbacks = feedbacks
    .filter((f) => {
      const matchesSearch = f.user.name.toLowerCase().includes(search.toLowerCase()) ||
                           f.user.email.toLowerCase().includes(search.toLowerCase()) ||
                           f.content.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = selectedStatus === "all" || 
                           (selectedStatus === "unread" && f.status === "PENDING" && f.replies.length === 0) ||
                           (selectedStatus === "replied" && f.replies.length > 0);
      
      const matchesCourse = !selectedCourse || f.course.id === selectedCourse;
      
      return matchesSearch && matchesStatus && matchesCourse;
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Get unique courses with feedback counts
  const courses = feedbacks.reduce((acc, feedback) => {
    const course = acc.find(c => c.id === feedback.course.id);
    const isUnread = feedback.status === "PENDING" && feedback.replies.length === 0;
    
    if (course) {
      course.count++;
      if (isUnread) course.unreadCount++;
    } else {
      acc.push({
        id: feedback.course.id,
        title: feedback.course.title,
        count: 1,
        unreadCount: isUnread ? 1 : 0
      });
    }
    return acc;
  }, [] as { id: string; title: string; count: number; unreadCount: number }[]);

  // Scroll to bottom when selected course changes or feedbacks change
  useEffect(() => {
    if (selectedCourse && filteredFeedbacks.length > 0) {
      scrollToBottom();
    }
  }, [selectedCourse, filteredFeedbacks.length, scrollToBottom]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700 px-3 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between flex-wrap gap-2 md:gap-4 mt-2 md:mt-4">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-base md:text-xl font-bold text-gray-900 dark:text-white">Student Feedback</h1>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                {filteredFeedbacks.length} conversation{filteredFeedbacks.length !== 1 ? 's' : ''}
                {unreadCount > 0 && (
                  <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                    • {unreadCount} unread
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                disabled={markingAllRead}
              >
                {markingAllRead ? (
                  <RefreshCw className="h-4 w-4 animate-spin md:mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 md:mr-2" />
                )}
                <span className="hidden md:inline">Mark All Read</span>
              </Button>
            )}
            <Button onClick={fetchFeedbacks} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar - Course Navigation */}
        <div className={`${
          sidebarOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden'
        } lg:relative lg:flex lg:w-80 w-80 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-700 flex-col transition-transform duration-300`}>
          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-end p-3 border-b border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Status Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <button
                onClick={() => { 
                  setSelectedStatus("all"); 
                  setSelectedCourse(null); 
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  selectedStatus === "all" && !selectedCourse
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <span className="font-medium">All Conversations</span>
                <Badge variant="secondary">{feedbacks.length}</Badge>
              </button>
              <button
                onClick={() => { 
                  setSelectedStatus("unread"); 
                  setSelectedCourse(null); 
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  selectedStatus === "unread" && !selectedCourse
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Unread</span>
                </div>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
                )}
              </button>
              <button
                onClick={() => { 
                  setSelectedStatus("replied"); 
                  setSelectedCourse(null); 
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  selectedStatus === "replied" && !selectedCourse
                    ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Replied</span>
                </div>
                <Badge variant="secondary">
                  {feedbacks.filter(f => f.replies.length > 0).length}
                </Badge>
              </button>
            </div>
          </div>

          {/* Course List */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 px-2">
                COURSES
              </h3>
              {courses.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  No feedback yet
                </p>
              ) : (
                courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => {
                      setSelectedCourse(course.id);
                      setSelectedStatus("all");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                      selectedCourse === course.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-sm truncate">{course.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {course.count} message{course.count !== 1 ? 's' : ''}
                        </span>
                        {course.unreadCount > 0 && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                              {course.unreadCount} new
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {course.unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white ml-2">
                        {course.unreadCount}
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 overflow-hidden">
          {selectedCourse && (
            <div className="px-3 md:px-6 py-2 md:py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3 md:h-4 w-3 md:w-4 text-blue-600" />
                  <span className="font-medium text-sm md:text-base text-gray-900 dark:text-white truncate">
                    {courses.find(c => c.id === selectedCourse)?.title}
                  </span>
                </div>
                <Button
                  onClick={() => setSelectedCourse(null)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading conversations...</p>
              </div>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No conversations found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {search ? "Try adjusting your search" : "No feedback submitted yet"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full w-full" ref={scrollRef}>
                <div className="p-3 md:p-6 space-y-4 md:space-y-6 max-w-4xl mx-auto pb-20">
                {filteredFeedbacks.map((feedback) => {
                  const isUnread = feedback.status === "PENDING" && feedback.replies.length === 0;
                  return (
                    <Card
                      key={feedback.id}
                      className={`p-3 md:p-6 transition-all ${
                        isUnread
                          ? "ring-2 ring-red-500 bg-red-50/50 dark:bg-red-900/10"
                          : "hover:shadow-md"
                      }`}
                    >
                      {/* User Message */}
                      <div className="flex gap-2 md:gap-4">
                        <div className="relative flex-shrink-0">
                          {feedback.user.profileImageUrl ? (
                            <Image
                              src={feedback.user.profileImageUrl}
                              alt={feedback.user.name}
                              width={40}
                              height={40}
                              className="rounded-full md:w-12 md:h-12"
                            />
                          ) : (
                            <Avatar className="h-10 w-10 md:h-12 md:w-12">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {getInitials(feedback.user.name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {isUnread && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate">
                                  {feedback.user.name}
                                </span>
                                {isUnread && (
                                  <Badge className="bg-red-500 text-white text-xs">NEW</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1 md:gap-2 mt-1 text-xs md:text-sm text-gray-500 flex-wrap">
                                <span className="truncate max-w-[150px] md:max-w-none">{feedback.user.email}</span>
                                <span className="hidden sm:inline">•</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span className="whitespace-nowrap">{format(new Date(feedback.createdAt), "MMM d, h:mm a")}</span>
                                </div>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {isUnread && (
                                  <DropdownMenuItem onClick={() => markAsRead(feedback.id)}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Mark as Read
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => deleteFeedback(feedback.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Feedback Content */}
                          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 md:p-4 mb-3 md:mb-4">
                            <p className="text-sm md:text-base text-gray-800 dark:text-gray-200 leading-relaxed break-words">
                              {feedback.content}
                            </p>
                          </div>

                          {/* Replies */}
                          {feedback.replies.length > 0 && (
                            <div className="ml-2 md:ml-4 space-y-2 md:space-y-3 mb-3 md:mb-4">
                              {feedback.replies.map((reply) => (
                                <div
                                  key={reply.id}
                                  className="flex gap-2 md:gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 md:p-4 border-l-4 border-blue-500"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 md:gap-2 mb-2 flex-wrap">
                                      <User className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                                      <span className="font-medium text-xs md:text-sm text-gray-900 dark:text-white">
                                        {reply.admin.name}
                                      </span>
                                      <span className="text-xs text-gray-500 whitespace-nowrap">
                                        {format(new Date(reply.createdAt), "MMM d, h:mm a")}
                                      </span>
                                    </div>
                                    <p className="text-sm md:text-base text-gray-800 dark:text-gray-200 break-words">
                                      {reply.message}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Quick Reply */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Type a reply..."
                              value={selectedFeedback?.id === feedback.id ? quickReplyText : ""}
                              onChange={(e) => {
                                setSelectedFeedback(feedback);
                                setQuickReplyText(e.target.value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  if (quickReplyText.trim()) {
                                    submitReply(feedback.id, quickReplyText);
                                  }
                                }
                              }}
                              className="flex-1"
                            />
                            <Button
                              onClick={() => {
                                if (quickReplyText.trim()) {
                                  submitReply(feedback.id, quickReplyText);
                                }
                              }}
                              disabled={!quickReplyText.trim() || submittingReply}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {submittingReply && selectedFeedback?.id === feedback.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
