"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Mail,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Send,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

type ConversationType = "NEW_INQUIRY" | "ADMIN_REPLY" | "USER_REPLY";
type ContactStatus = "PENDING" | "RESOLVED" | "DELETED";

type ConversationMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  cleanMessage: string;
  status: ContactStatus;
  conversationType: ConversationType;
  createdAt: string;
  updatedAt: string;
  isAdmin: boolean;
};

type AdminConversation = {
  id: string;
  threadId: string | null;
  rootContactId: string;
  name: string;
  email: string;
  subject: string;
  status: ContactStatus;
  hasAdminReply: boolean;
  totalMessages: number;
  unreadUserCount: number;
  needsReply: boolean;
  lastMessageAt: string;
  createdAt: string;
  messages: ConversationMessage[];
};

type KeepSelection = {
  threadId?: string | null;
  rootContactId?: string | null;
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AdminContactUsPage() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [showNeedsReplyOnly, setShowNeedsReplyOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [selected, setSelected] = useState<AdminConversation | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);

  const updateSelectedAfterRefresh = useCallback((
    nextConversations: AdminConversation[],
    keepSelection?: KeepSelection
  ) => {
    if (!keepSelection) return;

    const nextSelected = nextConversations.find((item) => {
      if (keepSelection.threadId && item.threadId) {
        return item.threadId === keepSelection.threadId;
      }
      if (keepSelection.rootContactId) {
        return item.rootContactId === keepSelection.rootContactId;
      }
      return false;
    });

    if (nextSelected) {
      setSelected(nextSelected);
    }
  }, []);

  const fetchConversations = useCallback(async (opts?: { keepSelection?: KeepSelection }) => {
    setRefreshing(true);
    if (!opts?.keepSelection) setLoading(true);

    try {
      const res = await fetch("/api/admin/contact-us/conversations");
      if (!res.ok) throw new Error("Failed to fetch conversations");

      const data = await res.json();
      const nextConversations = (data?.conversations || []) as AdminConversation[];
      setConversations(nextConversations);
      setError(null);
      updateSelectedAfterRefresh(nextConversations, opts?.keepSelection);
    } catch (err) {
      console.error(err);
      setError("Failed to load contact conversations. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateSelectedAfterRefresh]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const matchSearch =
        !q ||
        conversation.name.toLowerCase().includes(q) ||
        conversation.email.toLowerCase().includes(q) ||
        conversation.subject.toLowerCase().includes(q);

      const matchNeedsReply = !showNeedsReplyOnly || conversation.needsReply;
      return matchSearch && matchNeedsReply;
    });
  }, [conversations, search, showNeedsReplyOnly]);

  const PAGE_SIZE = 10;

  const totalPages = Math.max(1, Math.ceil(filteredConversations.length / PAGE_SIZE));

  const paginatedConversations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredConversations.slice(start, end);
  }, [filteredConversations, currentPage]);

  const needsReplyCount = useMemo(
    () => conversations.filter((item) => item.needsReply).length,
    [conversations]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, showNeedsReplyOnly]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openChatDialog = (conversation: AdminConversation) => {
    setSelected(conversation);
    setReplyText("");
    setChatOpen(true);
  };

  const openDeleteDialog = (conversation: AdminConversation) => {
    setSelected(conversation);
    setDeleteOpen(true);
  };

  const handleRefresh = async () => {
    await fetchConversations({
      keepSelection: selected
        ? { threadId: selected.threadId, rootContactId: selected.rootContactId }
        : undefined,
    });
    toast.success("Conversations refreshed");
  };

  const handleSendReply = async () => {
    if (!selected) return;
    if (!replyText.trim()) {
      toast.error("Please write a reply message first");
      return;
    }

    setReplySending(true);
    try {
      const res = await fetch("/api/admin/contact-us/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rootContactId: selected.rootContactId,
          threadId: selected.threadId,
          to: selected.email,
          userName: selected.name,
          subject: selected.subject,
          message: replyText,
          status: "RESOLVED",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to send reply");
      }

      toast.success("Reply sent and email delivered");
      setReplyText("");

      await fetchConversations({
        keepSelection: {
          threadId: data?.threadId || selected.threadId,
          rootContactId: selected.rootContactId,
        },
      });

      setChatOpen(true);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setReplySending(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selected) return;

    try {
      const res = await fetch(`/api/contact-us/${selected.rootContactId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete conversation");

      toast.success("Conversation deleted");
      setDeleteOpen(false);
      setSelected(null);
      await fetchConversations();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete conversation");
    }
  };

  if (loading) {
    return <div className="p-6 text-sm">Loading contact conversations...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        {error}
      </div>
    );
  }

  const chatConversation = selected;
  const chatUnreadCount = chatConversation?.unreadUserCount ?? 0;

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="rounded-2xl border bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-4 sm:p-6 text-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Contact Inbox</h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1">
              One unified chat thread per user email to avoid split replies.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="gap-2 bg-white/10 text-white hover:bg-white/20"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or subject..."
          className="sm:max-w-lg"
        />

        <Button
          variant={showNeedsReplyOnly ? "default" : "outline"}
          size="sm"
          className="gap-2"
          onClick={() => setShowNeedsReplyOnly((prev) => !prev)}
        >
          <MessageSquare className="h-4 w-4" />
          {showNeedsReplyOnly ? "Show All" : `Needs Reply (${needsReplyCount})`}
        </Button>
      </div>

      <div className="rounded-2xl border overflow-hidden">
        <div className="bg-slate-950 text-slate-100 px-4 py-3 text-sm flex items-center justify-between">
          <span>{filteredConversations.length} conversations</span>
          <span className="text-slate-300">Latest activity first</span>
        </div>

        <div className="divide-y">
          {paginatedConversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No contact conversations found.
            </div>
          ) : (
            paginatedConversations.map((conversation) => {
              const latest = conversation.messages[conversation.messages.length - 1];

              return (
                <div
                  key={conversation.id}
                  className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {conversation.name}
                      </span>
                      <span className="text-xs text-muted-foreground break-all inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {conversation.email}
                      </span>
                    </div>

                    <p className="text-sm font-medium truncate max-w-[64ch]">{conversation.subject}</p>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {conversation.status === "DELETED" ? (
                        <Badge variant="destructive">Deleted</Badge>
                      ) : (
                        <Badge
                          variant={conversation.needsReply ? "secondary" : "default"}
                          className={conversation.needsReply ? "bg-amber-100 text-amber-900" : "bg-emerald-700 text-white"}
                        >
                          {conversation.needsReply ? "Pending" : "Resolved"}
                        </Badge>
                      )}

                      <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                        Email Thread
                      </Badge>

                      <Badge variant="outline">{conversation.totalMessages} messages</Badge>

                      <span className="text-muted-foreground inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateTime(conversation.lastMessageAt)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-1">{latest?.cleanMessage || "-"}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button
                      size="sm"
                      className="relative bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => openChatDialog(conversation)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                      {conversation.unreadUserCount > 0 && (
                        <span className="absolute -top-2 -right-2 min-w-5 h-5 rounded-full bg-red-600 text-white text-[10px] leading-5 px-1 text-center">
                          {conversation.unreadUserCount}
                        </span>
                      )}
                    </Button>

                    <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(conversation)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {filteredConversations.length > 0 && (
          <div className="flex items-center justify-between border-t bg-slate-950/70 px-4 py-3 text-xs text-slate-200">
            <span>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}-
              {Math.min(currentPage * PAGE_SIZE, filteredConversations.length)} of {filteredConversations.length}
            </span>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>

              <span className="px-2">Page {currentPage} / {totalPages}</span>

              <Button
                size="sm"
                variant="outline"
                className="h-8 border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="w-[96vw] max-w-3xl h-[90vh] p-0 overflow-hidden border-slate-900 bg-[#020617] text-slate-100">
          <div className="h-full min-h-0 flex flex-col">
            <DialogHeader className="px-4 py-3 border-b border-slate-800 bg-slate-950 text-slate-100">
              <DialogTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Conversation Chat
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                {selected?.name} ({selected?.email})
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 min-h-0 px-3 sm:px-5 py-4 bg-gradient-to-b from-black via-slate-950 to-slate-900">
              <div className="space-y-3 pr-1 sm:pr-2">
                {chatConversation?.messages.map((msg) => {
                  const isAdmin = msg.isAdmin;
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[90%] sm:max-w-[78%] rounded-2xl px-3 py-2 border shadow-sm ${
                          isAdmin
                            ? "bg-slate-700 text-slate-50 border-slate-600"
                            : "bg-slate-900 text-slate-100 border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 text-[11px] mb-1 opacity-85">
                          <span className="font-medium">{isAdmin ? "Admin" : msg.name}</span>
                          <span>•</span>
                          <span>{formatDateTime(msg.createdAt)}</span>
                          {msg.conversationType === "USER_REPLY" && chatUnreadCount > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              New
                            </span>
                          )}
                        </div>

                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.cleanMessage}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="border-t border-slate-800 bg-[#020617] p-3 sm:p-4 space-y-3">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply to this user..."
                rows={4}
                className="resize-none border-slate-700 bg-black/60 text-slate-100 placeholder:text-slate-400"
              />

              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Reply is sent as email and logged in this chat.
                </div>

                <Button onClick={handleSendReply} disabled={replySending || !replyText.trim()}>
                  <Send className="h-4 w-4 mr-1" />
                  {replySending ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              This removes the full conversation thread and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConversation}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
