"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Trash2, MessageCircle } from "lucide-react";

interface Feedback {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
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
  const [search, setSearch] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [replyMessage, setReplyMessage] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // Fetch feedbacks from API
  const fetchFeedbacks = async () => {
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
    } catch (err) {
      console.error(err);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // Submit reply to selected feedback
  const submitReply = async () => {
    if (!selectedFeedback || !replyMessage.trim()) return;
    setReplyLoading(true);
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
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
      alert("Error sending reply");
    } finally {
      setReplyLoading(false);
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
      fetchFeedbacks();
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
    fetchFeedbacks();
  } catch (err: any) {
    console.error(err);
    alert(err.message || "Error deleting feedback");
  }
};

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(
    (f) =>
      f.user.name.toLowerCase().includes(search.toLowerCase()) ||
      f.user.email.toLowerCase().includes(search.toLowerCase()) ||
      f.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        Course Feedbacks
      </h1>

      <Input
        placeholder="Search by user, email, or content..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {loading ? (
        <div className="space-y-2 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-muted/20 dark:bg-muted/30 rounded-md animate-pulse"
            />
          ))}
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="mt-6 text-center text-muted-foreground">
          <p>No feedbacks found.</p>
        </div>
      ) : (
        <Accordion type="multiple" className="mt-4 space-y-2">
          {filteredFeedbacks.map((f) => (
            <AccordionItem key={f.id} value={f.id}>
              <AccordionTrigger className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {f.user.name} ({f.user.email})
                  </p>
                  <p className="text-sm text-muted-foreground">{f.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted: {format(new Date(f.createdAt), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFeedback(f.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFeedback(f);
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 bg-muted/10 dark:bg-muted/20 p-4 rounded-b-lg">
                {f.replies.length > 0 ? (
                  f.replies.map((r) => (
                    <div
                      key={r.id}
                      className="flex justify-between items-start bg-primary/10 dark:bg-primary/20 rounded-md p-2"
                    >
                      <div>
                        <p className="text-sm">{r.message}</p>
                        <p className="text-xs text-muted-foreground">
                          Replied by {r.admin.name} on{" "}
                          {format(new Date(r.createdAt), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => deleteReply(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No replies yet.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Reply Modal */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reply to {selectedFeedback?.user.name}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            rows={4}
            placeholder="Type your reply..."
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
              Cancel
            </Button>
            <Button onClick={submitReply} disabled={replyLoading}>
              {replyLoading ? "Sending..." : "Send Reply"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
