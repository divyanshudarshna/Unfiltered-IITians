"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function FeedbackModal({
  courseId,
  open,
  onOpenChange,
  onSuccess,
}: {
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name?: string; email?: string } | null>(null);
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
      }
    };

    if (open) fetchUserInfo();
  }, [open, getToken, userId]);

  const submitFeedback = async () => {
    if (!content.trim()) return;
    setLoading(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId, content }),
      });

      if (!res.ok) throw new Error("Failed to submit feedback");

      setContent("");
      onOpenChange(false);
      if (onSuccess) onSuccess();
      alert("Feedback submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Error submitting feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full bg-white dark:bg-gray-900 rounded-xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Submit Your Question / Feedback</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted-foreground">
            Registered students can ask questions, doubts, or report any issues regarding the course. 
            Your instructor will reply directly via email and notifications will also appear in your announcements.
          </DialogDescription>
        </DialogHeader>

        {/* User Info */}
        <div className="mt-4 flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {userInfo ? (
            <>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{userInfo.name || "Student"}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{userInfo.email}</span>
              </div>
              <Badge variant="outline" className="ml-auto">
                Student
              </Badge>
            </>
          ) : (
            <Skeleton className="h-8 w-48" />
          )}
        </div>

        {/* Feedback Textarea */}
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your question or feedback here..."
          rows={6}
          className="mt-6"
        />

        {/* Submit Button */}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={submitFeedback} disabled={loading}>
            {loading ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
