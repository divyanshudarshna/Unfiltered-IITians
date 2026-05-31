"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Clock3, MessageSquareHeart, PencilLine } from "lucide-react";

type ApplicationStatus = "pending" | "approved" | "rejected" | string;

interface SuccessStoryApplication {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  approvalStatus: ApplicationStatus;
  approvalNotes: string | null;
  updatedAt: string;
}

const statusStyles: Record<string, string> = {
  approved:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-800/50",
  pending:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-800/50",
  rejected:
    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/25 dark:text-rose-300 dark:border-rose-800/50",
};

function formatStatus(status: ApplicationStatus) {
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function SuccessStoryApplicationCard() {
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<SuccessStoryApplication | null>(null);

  useEffect(() => {
    async function fetchStory() {
      try {
        const res = await fetch("/api/success-story-application", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && data.story) {
          setStory(data.story);
        }
      } catch {
        // keep dashboard resilient
      } finally {
        setLoading(false);
      }
    }

    fetchStory();
  }, []);

  const status = story?.approvalStatus ?? "pending";
  const statusClassName = statusStyles[status] ?? statusStyles.pending;

  const statusLine = useMemo(() => {
    if (status === "approved") {
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
        text: "Approved by admin and now visible on the success-stories page.",
      };
    }

    if (status === "rejected") {
      return {
        icon: <AlertCircle className="h-4 w-4 text-rose-500" />,
        text: "Needs updates. Edit and resubmit for approval.",
      };
    }

    return {
      icon: <Clock3 className="h-4 w-4 text-amber-500" />,
      text: "Under admin review. It will be published only after approval.",
    };
  }, [status]);

  if (loading) {
    return (
      <Card className="shadow-lg rounded-2xl border border-border bg-background dark:bg-zinc-900/60">
        <CardHeader>
          <CardTitle>Your Success Story</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Loading your success story...
        </CardContent>
      </Card>
    );
  }

  if (!story) {
    return (
      <Card className="shadow-lg rounded-2xl border border-border bg-background dark:bg-zinc-900/60">
        <CardHeader>
          <CardTitle>Your Success Story</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-start gap-2 text-muted-foreground">
            <MessageSquareHeart className="h-4 w-4 mt-0.5 text-violet-500" />
            <p>
              Share your success journey with the community. Once approved by admin, your story
              appears on the success-stories page.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/success-story-form">Share Your Success Story</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-2xl border border-border bg-background dark:bg-zinc-900/60 hover:shadow-xl transition-all">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Your Success Story</CardTitle>
          <Badge className={`capitalize ${statusClassName}`}>{formatStatus(status)}</Badge>
        </div>
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          {statusLine.icon}
          <p>{statusLine.text}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2">
          <p>
            <strong>Name:</strong> {story.name}
          </p>
          <p>
            <strong>Role/Achievement:</strong> {story.role}
          </p>
          <p>
            <strong>Rating:</strong> {story.rating.toFixed(1)} / 5
          </p>
          <p className="text-muted-foreground line-clamp-3">{story.content}</p>
          <p className="text-xs text-muted-foreground">
            Updated {new Date(story.updatedAt).toLocaleDateString("en-GB")}
          </p>
        </div>

        {status === "rejected" && story.approvalNotes && (
          <div className="rounded-xl border border-rose-200/70 dark:border-rose-800/40 bg-rose-50/60 dark:bg-rose-900/10 p-3 text-xs text-rose-700 dark:text-rose-300">
            <strong>Admin note:</strong> {story.approvalNotes}
          </div>
        )}

        <Button asChild variant="outline" className="w-full">
          <Link href="/success-story-form?edit=1">
            <PencilLine className="h-4 w-4 mr-2" />
            Edit Success Story
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
