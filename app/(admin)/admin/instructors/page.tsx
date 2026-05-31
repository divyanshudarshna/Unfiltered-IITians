// app/(admin)/admin/instructors/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  UserCircle,
  Plus,
  RotateCcw,
  Users,
  BookOpen,
  CheckCircle,
  ClipboardCopy,
  ExternalLink,
  Clock,
} from "lucide-react";
import InstructorTable from "./InstructorTable";
import InstructorForm from "./InstructorForm";

interface CourseRow {
  id: string;
  title: string;
  status: string;
}

interface CourseInstructorRow {
  courseId: string;
  order: number;
  course: CourseRow;
}

interface Instructor {
  id: string;
  fullName: string;
  email?: string;
  title?: string;
  profileImageUrl?: string;
  isActive: boolean;
  isApproved: boolean;
  approvalStatus: string;
  submittedViaForm: boolean;
  approvedAt?: string;
  approvalNotes?: string;
  order: number;
  courseInstructors: CourseInstructorRow[];
  academicAffiliations: unknown[];
  researchAppointments: unknown[];
  expertiseAreas: string[];
  awards?: string;
  bio?: string;
  socialLinks?: unknown;
}

export default function InstructorsAdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [allCourses, setAllCourses] = useState<CourseRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInstructors = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/instructors", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setInstructors(data);
    } catch {
      toast.error("Failed to load instructors");
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/courses", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setAllCourses(data);
    } catch {
      // non-critical
    }
  }, []);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchInstructors(), fetchCourses()]);
    setLoading(false);
  }, [fetchInstructors, fetchCourses]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchInstructors(), fetchCourses()]);
    toast.success("Refreshed");
    setRefreshing(false);
  };

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  // Instructor form public URL
  const instructorFormUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/instructor-form`
      : "/instructor-form";

  const handleCopyFormUrl = () => {
    navigator.clipboard
      .writeText(instructorFormUrl)
      .then(() => toast.success("Form URL copied to clipboard!"))
      .catch(() => toast.error("Failed to copy URL"));
  };

  // Stats
  const stats = {
    total: instructors.length,
    active: instructors.filter((i) => i.isActive).length,
    pending: instructors.filter((i) => i.approvalStatus === "pending").length,
    rejected: instructors.filter((i) => i.approvalStatus === "rejected").length,
    totalAssignments: instructors.reduce((s, i) => s + i.courseInstructors.length, 0),
    withCourses: instructors.filter((i) => i.courseInstructors.length > 0).length,
  };

  const attentionCount = stats.pending + stats.rejected;

  const filterFromQuery = searchParams.get("filter");
  const activeFilter =
    filterFromQuery === "attention" ||
    filterFromQuery === "pending" ||
    filterFromQuery === "rejected" ||
    filterFromQuery === "approved"
      ? filterFromQuery
      : "all";

  const filteredInstructors = useMemo(() => {
    if (activeFilter === "attention") {
      return instructors.filter(
        (inst) => inst.approvalStatus === "pending" || inst.approvalStatus === "rejected"
      );
    }

    if (activeFilter === "all") return instructors;
    return instructors.filter((inst) => inst.approvalStatus === activeFilter);
  }, [activeFilter, instructors]);

  const handleFilterChange = (filter: "all" | "attention" | "pending" | "rejected" | "approved") => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "all") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const filterLabel =
    activeFilter === "attention"
      ? "Pending + Rejected"
      : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
              <UserCircle className="h-5 w-5" />
            </div>
            Instructor Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Review applications, approve instructors, and assign them to courses.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RotateCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                <Plus className="h-4 w-4" />
                New Instructor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Instructor</DialogTitle>
              </DialogHeader>
              <InstructorForm
                onSuccess={() => {
                  setOpen(false);
                  fetchInstructors();
                  toast.success("Instructor created");
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Instructor Form Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 p-4">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Public Instructor Application Form
          </p>
          <p className="text-xs text-purple-700 dark:text-purple-400">
            Share this link with prospective instructors — applications appear below for your review.
          </p>
          <p className="text-xs text-purple-600/70 dark:text-purple-500 font-mono truncate max-w-sm">
            {instructorFormUrl}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/40"
            onClick={handleCopyFormUrl}
          >
            <ClipboardCopy className="h-3.5 w-3.5 mr-1.5" />
            Copy URL
          </Button>
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => window.open("/instructor-form", "_blank")}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Open Form
          </Button>
        </div>
      </div>

      <Separator />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">instructors</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">visible on site</p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-md bg-gradient-to-br ${stats.pending > 0 ? "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30" : "from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900"}`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className={`h-4 w-4 ${stats.pending > 0 ? "text-amber-600" : "text-gray-400"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {stats.pending}
              {stats.pending > 0 && (
                <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">With Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withCourses}</div>
            <p className="text-xs text-muted-foreground">assigned to courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300">
        <strong>Workflow:</strong> Instructors can apply via the public form or be created directly here.
        Applications start as <em>Pending</em>. Use the <em>Approve</em> action to review their full
        profile and assign courses — only then will they go live on the platform and receive a
        confirmation email.
      </div>

      {/* Table */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2 mt-3">
                <UserCircle className="w-5 h-5 text-primary" />
                All Instructors
                {stats.pending > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 ml-1">
                    {stats.pending} pending
                  </Badge>
                )}
                {stats.rejected > 0 && (
                  <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200 ml-1">
                    {stats.rejected} rejected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {instructors.length > 0
                  ? `${filteredInstructors.length} shown of ${instructors.length} instructor${instructors.length !== 1 ? "s" : ""} — review pending applications and assign courses at approval`
                  : "No instructors yet. Create one or share the application form."}
              </CardDescription>
            </div>
            {filteredInstructors.length > 0 && (
              <Badge variant="secondary">
                {filterLabel}: {filteredInstructors.length}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              variant={activeFilter === "all" ? "default" : "outline"}
              onClick={() => handleFilterChange("all")}
              className="h-8"
            >
              All ({stats.total})
            </Button>
            <Button
              size="sm"
              variant={activeFilter === "attention" ? "default" : "outline"}
              onClick={() => handleFilterChange("attention")}
              className="h-8"
            >
              Needs Review ({attentionCount})
            </Button>
            <Button
              size="sm"
              variant={activeFilter === "pending" ? "default" : "outline"}
              onClick={() => handleFilterChange("pending")}
              className="h-8"
            >
              Pending ({stats.pending})
            </Button>
            <Button
              size="sm"
              variant={activeFilter === "rejected" ? "default" : "outline"}
              onClick={() => handleFilterChange("rejected")}
              className="h-8"
            >
              Rejected ({stats.rejected})
            </Button>
            <Button
              size="sm"
              variant={activeFilter === "approved" ? "default" : "outline"}
              onClick={() => handleFilterChange("approved")}
              className="h-8"
            >
              Approved ({stats.active})
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <InstructorTable
              instructors={filteredInstructors}
              allCourses={allCourses}
              onRefresh={fetchInstructors}
              emptyStateTitle={
                instructors.length > 0 ? "No instructors match this filter" : "No instructors yet"
              }
              emptyStateDescription={
                instructors.length > 0
                  ? "Try another status filter or clear filters to view all applications."
                  : "Create an instructor directly or share the application form."
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
