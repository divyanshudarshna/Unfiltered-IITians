"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Trash2, 
  MessageCircle, 
  RefreshCw, 
  Search,
  Clock,
  User,
  Mail,
  Send,
  Filter,
  CheckCircle2,
  AlertCircle,
  BookOpen
} from "lucide-react";

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
  const [replyMessage, setReplyMessage] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [markingRead, setMarkingRead] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

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
      setFeedbacks(data.feedbacks || []);
      
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

  // Submit reply to selected feedback
  const submitReply = async () => {
    if (!selectedFeedback || !replyMessage.trim()) return;
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
          feedbackId: selectedFeedback.id,
          message: replyMessage,
        }),
      });
      if (!res.ok) throw new Error("Failed to send reply");

      setReplyMessage("");
      setSelectedFeedback(null);
      fetchFeedbacks(); // This will also update unread count
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

      // Optimistically update the feedback status in state
      setFeedbacks(prev => 
        prev.map(f => f.id === feedbackId ? { ...f, status: "RESOLVED" } : f)
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      await fetchFeedbacks(); // Refresh to sync with server
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

      // Optimistically update all PENDING feedbacks to RESOLVED
      setFeedbacks(prev => 
        prev.map(f => f.status === "PENDING" ? { ...f, status: "RESOLVED" } : f)
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      await fetchFeedbacks(); // Refresh to sync with server
    } catch (err) {
      console.error(err);
      alert("Error marking all feedbacks as read");
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Delete a single reply
  const deleteReply = async (replyId: string) => {
    if (!confirm("Are you sure you want to delete this reply?")) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/feedback/reply/${replyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete reply");
      fetchFeedbacks(); // This will also update unread count
    } catch (err) {
      console.error(err);
      alert("Error deleting reply");
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
    fetchFeedbacks(); // This will also update unread count
  } catch (err: unknown) {
    console.error(err);
    alert(err instanceof Error ? err.message : "Error deleting feedback");
  }
};

  // Filter feedbacks based on search and status
  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesSearch = f.user.name.toLowerCase().includes(search.toLowerCase()) ||
                         f.user.email.toLowerCase().includes(search.toLowerCase()) ||
                         f.content.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || 
                         (selectedStatus === "unread" && f.status === "PENDING" && f.replies.length === 0) ||
                         (selectedStatus === "replied" && f.replies.length > 0);
    
    return matchesSearch && matchesStatus;
  });

  // Group feedbacks by course
  const groupedFeedbacks = filteredFeedbacks.reduce((acc, feedback) => {
    const courseId = feedback.course.id;
    if (!acc[courseId]) {
      acc[courseId] = {
        course: feedback.course,
        feedbacks: []
      };
    }
    acc[courseId].feedbacks.push(feedback);
    return acc;
  }, {} as Record<string, { course: { id: string; title: string; description?: string }, feedbacks: Feedback[] }>);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderFeedbackContent = () => {
    if (filteredFeedbacks.length === 0) {
      return (
        <Card className="p-12">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No feedback found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {search ? "Try adjusting your search terms" : "No student feedback submitted yet"}
            </p>
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-8">
        {Object.entries(groupedFeedbacks).map(([courseId, { course, feedbacks: courseFeedbacks }]) => (
          <div key={courseId} className="space-y-4">
            {/* Course Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {course.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {courseFeedbacks.length} feedback{courseFeedbacks.length !== 1 ? 's' : ''}
                    {courseFeedbacks.filter(f => f.status === "PENDING" && f.replies.length === 0).length > 0 && (
                      <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                        • {courseFeedbacks.filter(f => f.status === "PENDING" && f.replies.length === 0).length} unread
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Course Feedbacks */}
            <div className="grid gap-4 pl-4">
              {courseFeedbacks.map((feedback) => {
                const isUnread = feedback.status === "PENDING" && feedback.replies.length === 0;
                return (
                  <Card
                    key={feedback.id}
                    className={`transition-all duration-200 hover:shadow-md ${
                      isUnread 
                        ? "ring-2 ring-red-200 dark:ring-red-800 bg-red-50/50 dark:bg-red-900/10" 
                        : "hover:shadow-lg"
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          {/* User Profile Image or Avatar */}
                          <div className="relative">
                            {feedback.user.profileImageUrl ? (
                              <Image
                                src={feedback.user.profileImageUrl}
                                alt={feedback.user.name}
                                width={48}
                                height={48}
                                className="rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                              />
                            ) : (
                              <Avatar className="h-12 w-12 border-2 border-gray-200 dark:border-gray-700">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                  {getInitials(feedback.user.name)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {isUnread && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {feedback.user.name}
                              </h3>
                              {isUnread && (
                                <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                                  NEW
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {feedback.user.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(feedback.createdAt), "MMM d, yyyy 'at' h:mm a")}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <Button
                              onClick={() => markAsRead(feedback.id)}
                              size="sm"
                              variant="outline"
                              className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                              disabled={markingRead === feedback.id}
                            >
                              {markingRead === feedback.id ? (
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                              )}
                              Mark as Read
                            </Button>
                          )}
                          <Button
                            onClick={() => setSelectedFeedback(feedback)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Reply
                          </Button>
                          <Button
                            onClick={() => deleteFeedback(feedback.id)}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-4">
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                          {feedback.content}
                        </p>
                      </div>

                      {/* Replies Section */}
                      {feedback.replies.length > 0 && (
                        <div className="space-y-3">
                          <Separator />
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Admin Replies ({feedback.replies.length})
                          </div>
                          <div className="space-y-3">
                            {feedback.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-500"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-gray-800 dark:text-gray-200 mb-2">
                                      {reply.message}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                      <User className="h-3 w-3" />
                                      {reply.admin.name}
                                      <span>•</span>
                                      <Clock className="h-3 w-3" />
                                      {format(new Date(reply.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() => deleteReply(reply.id)}
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Student Feedback
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage and respond to course feedback from students
                </p>
              </div>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white px-3 py-1">
                  {unreadCount > 9 ? "9+" : unreadCount} New
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  disabled={markingAllRead}
                >
                  {markingAllRead ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Mark All as Read
                </Button>
              )}
              <Button
                onClick={fetchFeedbacks}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by student name, email, or feedback content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  All ({feedbacks.length})
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  New ({feedbacks.filter(f => f.status === "PENDING" && f.replies.length === 0).length})
                </TabsTrigger>
                <TabsTrigger value="replied" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Replied ({feedbacks.filter(f => f.replies.length > 0).length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={`skeleton-${i}`} className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    </div>
                  </div>
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          renderFeedbackContent()
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Reply to {selectedFeedback?.user.name}
            </DialogTitle>
            <DialogDescription>
              Respond to feedback from {selectedFeedback?.user.email} about {selectedFeedback?.course.title}
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4">
              {/* Original Feedback */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Original Feedback
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    • {selectedFeedback.course.title}
                  </span>
                </div>
                <p className="text-gray-800 dark:text-gray-200">
                  {selectedFeedback.content}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Submitted on {format(new Date(selectedFeedback.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>

              {/* Previous Replies */}
              {selectedFeedback.replies.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Previous Replies ({selectedFeedback.replies.length})
                  </div>
                  {selectedFeedback.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-l-4 border-blue-500"
                    >
                      <p className="text-gray-800 dark:text-gray-200 mb-2">
                        {reply.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>By {reply.admin.name}</span>
                        <span>•</span>
                        <span>{format(new Date(reply.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                      </div>
                    </div>
                  ))}
                  <Separator />
                </div>
              )}

              {/* Reply Form */}
              <div className="space-y-3">
                <Label htmlFor="reply-message" className="text-sm font-medium">
                  Your Reply
                </Label>
                <Textarea
                  id="reply-message"
                  placeholder="Write your response here..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedFeedback(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitReply}
                  disabled={!replyMessage.trim() || submittingReply}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submittingReply ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send Reply
                    </div>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
