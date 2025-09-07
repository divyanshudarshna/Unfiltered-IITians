"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Trash2, MessageCircle } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

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

  const deleteFeedback = async (feedbackId: string) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete feedback");
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
      alert("Error deleting feedback");
    }
  };

  // Table columns
  const columns = useMemo<ColumnDef<Feedback>[]>(
    () => [
      {
        header: "Student",
        accessorFn: (row) => row.user.name,
        cell: (info) => info.getValue(),
      },
      {
        header: "Email",
        accessorFn: (row) => row.user.email,
        cell: (info) => info.getValue(),
      },
      {
        header: "Feedback",
        accessorFn: (row) => row.content,
        cell: (info) => info.getValue(),
      },
      {
        header: "Date",
        accessorFn: (row) => row.createdAt,
        cell: (info) =>
          format(new Date(info.getValue() as string), "MMM d, yyyy h:mm a"),
      },
      {
        header: "Actions",
        accessorKey: "actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setSelectedFeedback(row.original)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Reply
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteFeedback(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: feedbacks.filter(
      (f) =>
        f.user.name.toLowerCase().includes(search.toLowerCase()) ||
        f.user.email.toLowerCase().includes(search.toLowerCase()) ||
        f.content.toLowerCase().includes(search.toLowerCase())
    ),
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

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
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-muted/20 dark:bg-muted/30 rounded-md animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full border rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-900">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="bg-white dark:bg-gray-950">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reply Modal */}
      <Dialog
        open={!!selectedFeedback}
        onOpenChange={() => setSelectedFeedback(null)}
      >
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
