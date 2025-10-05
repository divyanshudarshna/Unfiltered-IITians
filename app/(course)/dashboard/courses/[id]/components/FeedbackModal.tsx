"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, X, User } from "lucide-react";
import { toast } from "sonner";

interface FeedbackModalProps {
  readonly courseId: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: () => void;
}

interface UserInfo {
  name?: string;
  email?: string;
}

export function FeedbackModal({
  courseId,
  open,
  onOpenChange,
  onSuccess,
}: FeedbackModalProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const { getToken, userId } = useAuth();

  /** Fetch current user info */
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!userId) return;
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch("/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch user info");
        const data = await res.json();
        setUserInfo({ name: data.name, email: data.email });
      } catch (err) {
        console.error("Error fetching user info:", err);
        toast.error("Failed to load user information");
      }
    };

    if (open) fetchUserInfo();
  }, [open, getToken, userId]);

  // Clear content when modal closes
  useEffect(() => {
    if (!open) {
      setContent("");
    }
  }, [open]);

  const submitFeedback = useCallback(async () => {
    if (!content.trim()) {
      toast.error("Please enter your feedback before submitting");
      return;
    }
    
    if (content.trim().length > 1000) {
      toast.error("Feedback is too long. Please keep it under 1000 characters.");
      return;
    }
    
    setLoading(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId, content: content.trim() }),
      });

      if (!res.ok) throw new Error("Failed to submit feedback");

      setContent("");
      onOpenChange(false);
      if (onSuccess) onSuccess();
      toast.success("Feedback submitted successfully! You&apos;ll receive a reply via email.");
    } catch (err) {
      console.error("Error submitting feedback:", err);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [content, getToken, courseId, onOpenChange, onSuccess]);

  // Handle keyboard events to prevent interference with video controls
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Prevent spacebar from triggering video play/pause when typing
    if (e.key === ' ') {
      e.stopPropagation();
    }
    
    // Allow Ctrl+Enter to submit
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submitFeedback();
    }
  }, [submitFeedback]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  // Helper function for character count styling
  const getCharacterCountStyle = useCallback(() => {
    if (content.length > 900) return 'text-red-500 font-medium';
    if (content.length > 800) return 'text-yellow-500';
    return 'text-gray-400';
  }, [content.length]);

  const handleClose = useCallback(() => {
    if (loading) return;
    
    // Ask for confirmation if user has typed content
    if (content.trim() && content.trim().length > 10) {
      if (!confirm("You have unsaved feedback. Are you sure you want to close?")) {
        return;
      }
    }
    
    onOpenChange(false);
  }, [loading, content, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-4xl w-full bg-white dark:bg-gray-900 rounded-2xl p-0 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onKeyDown={(e) => e.stopPropagation()} // Prevent dialog events from bubbling up
      >
        {/* Header */}
        <div className="bg-primary/40 px-6 py-4 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <MessageSquare className="h-6 w-6" />
              </div>
              Submit Your Question / Feedback
            </DialogTitle>
            <DialogDescription className="mt-2 text-blue-100">
              Have a question or feedback about this course? Send it directly to your instructor. 
              You&apos;ll receive a reply via email and notifications will appear in your announcements.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info Card */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border border-gray-200 dark:border-gray-700">
            {userInfo ? (
              <>
                <div className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {userInfo.name || "Student"}
                    </span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Student
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{userInfo.email}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4 w-full">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            )}
          </div>

          {/* Feedback Input */}
          <div className="space-y-3">
            <label htmlFor="feedback-textarea" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Message *
            </label>
            <div className="relative">
              <Textarea
                id="feedback-textarea"
                value={content}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Describe your question, doubt, or feedback in detail. The more specific you are, the better we can help you..."
                rows={6}
                maxLength={1000}
                className="resize-none border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl p-4 text-base leading-relaxed"
                disabled={loading}
              />
              <div className={`absolute bottom-3 right-3 text-xs ${getCharacterCountStyle()}`}>
                {content.length}/1000 characters
              </div>
            </div>
            {content.trim() && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 Tip: Press Ctrl+Enter to submit quickly
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 border-2"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={submitFeedback} 
              disabled={loading || !content.trim()}
              className="px-6 py-2 bg-purple-800/40 hover:bg-purple-800 text-white font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
