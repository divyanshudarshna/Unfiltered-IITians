"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Clock3, FileText, PencilLine } from "lucide-react";

type ApplicationStatus = "pending" | "approved" | "rejected" | string;

interface InstructorApplication {
  id: string;
  fullName: string;
  email: string | null;
  title: string | null;
  expertiseAreas: string[];
  academicAffiliations: unknown[];
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

export function InstructorApplicationCard() {
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<InstructorApplication | null>(null);

  useEffect(() => {
    async function fetchApplication() {
      try {
        const res = await fetch("/api/instructor-application", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && data.application) {
          setApplication(data.application);
        }
      } catch {
        // silent on dashboard, keep card resilient
      } finally {
        setLoading(false);
      }
    }

    fetchApplication();
  }, []);

  const status = application?.approvalStatus ?? "pending";
  const statusClassName = statusStyles[status] ?? statusStyles.pending;

  const statusLine = useMemo(() => {
    if (status === "approved") {
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
        text: "Approved by admin. Your instructor profile is live.",
      };
    }

    if (status === "rejected") {
      return {
        icon: <AlertCircle className="h-4 w-4 text-rose-500" />,
        text: "Needs updates. Edit and resubmit to send it for review again.",
      };
    }

    return {
      icon: <Clock3 className="h-4 w-4 text-amber-500" />,
      text: "Under admin review. You will be notified after approval.",
    };
  }, [status]);

  if (loading) {
    return (
      <Card className="shadow-lg rounded-2xl border border-border bg-background dark:bg-zinc-900/60">
        <CardHeader>
          <CardTitle>Instructor Profile</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Loading instructor application...
        </CardContent>
      </Card>
    );
  }

  if (!application) {
    return (
      <Card className="shadow-lg rounded-2xl border border-border bg-background dark:bg-zinc-900/60">
        <CardHeader>
          <CardTitle>Instructor Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-start gap-2 text-muted-foreground">
            <FileText className="h-4 w-4 mt-0.5 text-blue-500" />
            <p>
              Want to connect with us as a faculty mentor and teach on Unfiltered IITians?
              Complete the instructor form to get started.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/instructor-form">Fill Instructor Form</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-2xl border border-border bg-background dark:bg-zinc-900/60 hover:shadow-xl transition-all">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Instructor Profile</CardTitle>
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
            <strong>Name:</strong> {application.fullName}
          </p>
          <p>
            <strong>Email:</strong> {application.email ?? "Not provided"}
          </p>
          <p>
            <strong>Title:</strong> {application.title || "Not provided"}
          </p>
          <p>
            <strong>Expertise Tags:</strong> {application.expertiseAreas.length}
          </p>
          <p>
            <strong>Affiliations:</strong> {application.academicAffiliations.length}
          </p>
          <p className="text-xs text-muted-foreground">
            Updated {new Date(application.updatedAt).toLocaleDateString("en-GB")}
          </p>
        </div>

        {status === "rejected" && application.approvalNotes && (
          <div className="rounded-xl border border-rose-200/70 dark:border-rose-800/40 bg-rose-50/60 dark:bg-rose-900/10 p-3 text-xs text-rose-700 dark:text-rose-300">
            <strong>Admin note:</strong> {application.approvalNotes}
          </div>
        )}

        <Button asChild variant="outline" className="w-full">
          <Link href="/instructor-form?edit=1">
            <PencilLine className="h-4 w-4 mr-2" />
            Edit Instructor Form
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
