"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  BookOpen,
  UserCircle,
  PlusCircle,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  GraduationCap,
  FlaskConical,
  Globe,
  Linkedin,
  Star,
  Mail,
  Loader2,
  ExternalLink,
  AlertCircle,
  GripVertical,
  Save,
  RotateCcw,
} from "lucide-react";
import InstructorForm from "./InstructorForm";

// ── Types ────────────────────────────────────────────────────────────────────
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

interface AcademicAffiliation {
  name: string;
  role: string;
  year: string;
  logoUrl: string;
}

interface ResearchAppointment {
  org: string;
  role: string;
  period: string;
}

interface SocialLinks {
  website?: string;
  linkedin?: string;
  researchgate?: string;
  twitter?: string;
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

interface InstructorTableProps {
  instructors: Instructor[];
  allCourses: CourseRow[];
  onRefresh: () => void;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

// ── Approval status badge ────────────────────────────────────────────────────
function ApprovalBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 gap-1">
        <CheckCircle2 className="h-3 w-3" /> Approved
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 gap-1">
        <XCircle className="h-3 w-3" /> Rejected
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 gap-1">
      <Clock className="h-3 w-3" /> Pending
    </Badge>
  );
}

// ── Main Table Component ──────────────────────────────────────────────────────
export default function InstructorTable({
  instructors,
  allCourses,
  onRefresh,
  emptyStateTitle,
  emptyStateDescription,
}: InstructorTableProps) {
  const [editInstructor, setEditInstructor] = useState<Instructor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Course-assign dialog (for approved instructors only)
  const [assignInstructor, setAssignInstructor] = useState<Instructor | null>(null);
  const [assigningCourseId, setAssigningCourseId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [removingCourseId, setRemovingCourseId] = useState<string | null>(null);

  // Approve dialog
  const [approveInstructor, setApproveInstructor] = useState<Instructor | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [approving, setApproving] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // ── Drag-and-drop order state ────────────────────────────────────────────
  const [localInstructors, setLocalInstructors] = useState<Instructor[]>(instructors);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Keep localInstructors in sync when parent refreshes (but not if we have unsaved changes)
  useEffect(() => {
    if (!hasChanges) setLocalInstructors(instructors);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructors]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalInstructors((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        setHasChanges(true);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    try {
      setIsSaving(true);
      const instructorOrders = localInstructors.map((inst, i) => ({ id: inst.id, order: i + 1 }));
      const res = await fetch("/api/admin/instructors/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructorOrders }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
      toast.success("Instructor order saved");
      setHasChanges(false);
      onRefresh();
    } catch {
      toast.error("Failed to save instructor order");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelReorder = () => {
    setLocalInstructors(instructors);
    setHasChanges(false);
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/instructors/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Instructor deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete instructor");
    } finally {
      setDeleteId(null);
    }
  };

  // ── Approve / Reject ─────────────────────────────────────────────────────
  const openApproveDialog = (inst: Instructor) => {
    setApproveInstructor(inst);
    setApprovalNotes(inst.approvalNotes ?? "");
    // Pre-select already assigned courses
    setSelectedCourseIds(inst.courseInstructors.map((ci) => ci.courseId));
  };

  const handleApprove = async () => {
    if (!approveInstructor) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/admin/instructors/${approveInstructor.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          courseIds: selectedCourseIds,
          approvalNotes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to approve");
      }
      toast.success(`${approveInstructor.fullName} approved! Confirmation email sent.`, {
        duration: 5000,
      });
      setApproveInstructor(null);
      setApprovalNotes("");
      setSelectedCourseIds([]);
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (id: string) => {
    setRejectingId(id);
    try {
      const res = await fetch(`/api/admin/instructors/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      toast.success("Application rejected");
      onRefresh();
    } catch {
      toast.error("Failed to reject application");
    } finally {
      setRejectingId(null);
    }
  };

  // ── Course assignment (for already-approved instructors) ─────────────────
  const handleAssignCourse = async () => {
    if (!assignInstructor || !assigningCourseId) return;
    setAssignLoading(true);
    try {
      const res = await fetch(`/api/admin/instructors/${assignInstructor.id}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: assigningCourseId }),
      });
      if (!res.ok) throw new Error("Failed to assign");
      toast.success("Course assigned");
      setAssigningCourseId("");
      onRefresh();
      const updated = await fetch(`/api/admin/instructors/${assignInstructor.id}`).then((r) =>
        r.json()
      );
      setAssignInstructor(updated);
    } catch {
      toast.error("Failed to assign course");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveCourse = async (instructorId: string, courseId: string) => {
    setRemovingCourseId(courseId);
    try {
      const res = await fetch(`/api/admin/instructors/${instructorId}/courses`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) throw new Error("Failed to remove");
      toast.success("Course removed");
      onRefresh();
      const updated = await fetch(`/api/admin/instructors/${instructorId}`).then((r) => r.json());
      setAssignInstructor(updated);
    } catch {
      toast.error("Failed to remove course");
    } finally {
      setRemovingCourseId(null);
    }
  };

  const unassignedCourses = assignInstructor
    ? allCourses.filter(
        (c) => !assignInstructor.courseInstructors.some((ci) => ci.courseId === c.id)
      )
    : [];

  // Course toggle for approval dialog
  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  if (localInstructors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <UserCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">{emptyStateTitle || "No instructors yet"}</p>
        <p className="text-sm text-muted-foreground">
          {emptyStateDescription || "Create an instructor directly or share the application form."}
        </p>
      </div>
    );
  }

  // ── SortableRow ────────────────────────────────────────────────────────────
  function SortableRow({ inst, children }: { inst: Instructor; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: inst.id,
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };
    return (
      <TableRow
        ref={setNodeRef}
        style={style}
        className={`${inst.approvalStatus === "pending" ? "bg-amber-50/40 dark:bg-amber-950/10" : ""} ${isDragging ? "bg-muted/50" : ""}`}
      >
        <TableCell className="w-10 text-center">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none select-none flex items-center justify-center p-3 hover:bg-muted/50 rounded mx-auto w-fit"
            style={{ touchAction: "none" }}
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </TableCell>
        {children}
      </TableRow>
    );
  }

  return (
    <>
      {/* ── Unsaved order banner ─────────────────────────────────────────────── */}
      {hasChanges && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-3 mb-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 text-sm text-amber-800 dark:text-amber-300">
          <p className="flex items-center gap-2 font-medium">
            <GripVertical className="h-4 w-4" />
            Drag to reorder instructors, then save to apply.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelReorder}
              disabled={isSaving}
              className="h-7 gap-1.5 text-xs"
            >
              <RotateCcw className="h-3 w-3" /> Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveOrder}
              disabled={isSaving}
              className="h-7 gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              {isSaving ? "Saving..." : "Save Order"}
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">
                <GripVertical className="h-4 w-4 mx-auto text-muted-foreground" />
              </TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <SortableContext items={localInstructors.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <TableBody>
            {localInstructors.map((inst) => (
              <SortableRow key={inst.id} inst={inst}>
                {/* Instructor */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden border bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shrink-0">
                      {inst.profileImageUrl ? (
                        <Image
                          src={inst.profileImageUrl}
                          alt={inst.fullName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {inst.fullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{inst.fullName}</p>
                      {inst.email && (
                        <p className="text-xs text-muted-foreground">{inst.email}</p>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Title */}
                <TableCell>
                  <p className="text-sm text-muted-foreground line-clamp-2 max-w-[180px]">
                    {inst.title || "—"}
                  </p>
                </TableCell>

                {/* Approval Status */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <ApprovalBadge status={inst.approvalStatus} />
                    <Badge
                      className={`text-[10px] px-1.5 py-0 w-fit ${
                        inst.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {inst.isActive ? "Live" : "Hidden"}
                    </Badge>
                  </div>
                </TableCell>

                {/* Courses */}
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {inst.courseInstructors.length === 0 ? (
                      <span className="text-xs text-muted-foreground">None</span>
                    ) : (
                      inst.courseInstructors.slice(0, 2).map((ci) => (
                        <Badge key={ci.courseId} variant="outline" className="text-xs">
                          {ci.course.title.length > 16
                            ? ci.course.title.substring(0, 16) + "…"
                            : ci.course.title}
                        </Badge>
                      ))
                    )}
                    {inst.courseInstructors.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{inst.courseInstructors.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Source */}
                <TableCell>
                  {inst.submittedViaForm ? (
                    <Badge variant="outline" className="text-xs gap-1 text-blue-700 border-blue-300">
                      <ExternalLink className="h-2.5 w-2.5" /> Public Form
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs gap-1 text-gray-500">
                      <ShieldCheck className="h-2.5 w-2.5" /> Admin
                    </Badge>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    {/* Approve button (shown if pending or rejected) */}
                    {inst.approvalStatus !== "approved" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white h-7 px-2.5 text-xs"
                        onClick={() => openApproveDialog(inst)}
                      >
                        <ShieldCheck className="h-3 w-3 mr-1" /> Approve
                      </Button>
                    )}

                    {/* Reject (shown if pending) */}
                    {inst.approvalStatus === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 h-7 px-2.5 text-xs"
                        disabled={rejectingId === inst.id}
                        onClick={() => handleReject(inst.id)}
                      >
                        {rejectingId === inst.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        Reject
                      </Button>
                    )}

                    {/* Courses (only for approved) */}
                    {inst.approvalStatus === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAssignInstructor(inst)}
                        title="Manage courses"
                        className="h-7 px-2.5 text-xs"
                      >
                        <BookOpen className="h-3 w-3 mr-1" /> Courses
                      </Button>
                    )}

                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setEditInstructor(inst)}
                      title="Edit"
                      className="h-7 w-7"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => setDeleteId(inst.id)}
                      title="Delete"
                      className="h-7 w-7"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </SortableRow>
            ))}
          </TableBody>
          </SortableContext>
        </Table>
        </DndContext>
      </div>

      {/* ── Approve Dialog ────────────────────────────────────────────────────── */}
      <Dialog
        open={!!approveInstructor}
        onOpenChange={(o) => {
          if (!o) {
            setApproveInstructor(null);
            setApprovalNotes("");
            setSelectedCourseIds([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Review & Approve Instructor
            </DialogTitle>
            <DialogDescription>
              Review all submitted details below. Assign the appropriate courses before approving.
              A confirmation email will be sent automatically.
            </DialogDescription>
          </DialogHeader>

          {approveInstructor && (
            <div className="space-y-5 mt-2">
              {/* Profile Header */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-100 dark:border-purple-800">
                <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shrink-0">
                  {approveInstructor.profileImageUrl ? (
                    <Image
                      src={approveInstructor.profileImageUrl}
                      alt={approveInstructor.fullName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-white font-bold text-xl">
                      {approveInstructor.fullName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight">
                    {approveInstructor.fullName}
                  </h3>
                  {approveInstructor.title && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      {approveInstructor.title}
                    </p>
                  )}
                  {approveInstructor.email && (
                    <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-1 mt-1">
                      <Mail className="h-3.5 w-3.5" />
                      {approveInstructor.email}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {approveInstructor.submittedViaForm && (
                      <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">
                        <ExternalLink className="h-2.5 w-2.5 mr-1" /> Via Public Form
                      </Badge>
                    )}
                    <ApprovalBadge status={approveInstructor.approvalStatus} />
                  </div>
                </div>
              </div>

              {/* Bio */}
              {approveInstructor.bio && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bio</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                    {approveInstructor.bio}
                  </p>
                </div>
              )}

              {/* Expertise */}
              {approveInstructor.expertiseAreas.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Expertise Areas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {approveInstructor.expertiseAreas.map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Academic Affiliations */}
              {(approveInstructor.academicAffiliations as AcademicAffiliation[]).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" /> Academic Affiliations
                  </p>
                  <div className="space-y-1.5">
                    {(approveInstructor.academicAffiliations as AcademicAffiliation[]).map(
                      (aff, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5 border border-gray-100 dark:border-gray-700"
                        >
                          {aff.logoUrl && (
                            <Image
                              src={aff.logoUrl}
                              alt={aff.name}
                              width={28}
                              height={28}
                              className="h-7 w-7 object-contain rounded"
                              unoptimized
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {aff.name}
                            </span>
                            {aff.role && (
                              <span className="text-gray-500 ml-1.5">— {aff.role}</span>
                            )}
                            {aff.year && (
                              <span className="text-gray-400 ml-1.5 text-xs">({aff.year})</span>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Research Appointments */}
              {(approveInstructor.researchAppointments as ResearchAppointment[]).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <FlaskConical className="h-3.5 w-3.5" /> Research Appointments
                  </p>
                  <div className="space-y-1.5">
                    {(approveInstructor.researchAppointments as ResearchAppointment[]).map(
                      (appt, i) => (
                        <div
                          key={i}
                          className="text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5 border border-gray-100 dark:border-gray-700"
                        >
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {appt.org}
                          </span>
                          {appt.role && (
                            <span className="text-gray-500 ml-1.5">— {appt.role}</span>
                          )}
                          {appt.period && (
                            <span className="text-gray-400 ml-1.5 text-xs">({appt.period})</span>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Awards */}
              {approveInstructor.awards && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5" /> Awards & Recognition
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                    {approveInstructor.awards}
                  </p>
                </div>
              )}

              {/* Social Links */}
              {!!approveInstructor.socialLinks &&
                Object.values(approveInstructor.socialLinks as SocialLinks).some(Boolean) && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" /> Online Presence
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(approveInstructor.socialLinks as SocialLinks)
                        .filter(([, v]) => v)
                        .map(([key, url]) => (
                          <a
                            key={key}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800"
                          >
                            {key === "linkedin" ? (
                              <Linkedin className="h-3 w-3" />
                            ) : (
                              <Globe className="h-3 w-3" />
                            )}
                            {key}
                          </a>
                        ))}
                    </div>
                  </div>
                )}

              <Separator />

              {/* Course Assignment (CRITICAL — admin-only) */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    Assign Courses
                    <span className="text-xs font-normal text-gray-500 ml-1">
                      (based on expertise & qualifications)
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select which courses this instructor should be assigned to. This can be updated
                    after approval.
                  </p>
                </div>

                {allCourses.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4 text-center text-sm text-gray-400">
                    No courses available yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {allCourses.map((course) => {
                      const isSelected = selectedCourseIds.includes(course.id);
                      return (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => toggleCourse(course.id)}
                          className={`flex items-center gap-2.5 text-left p-2.5 rounded-lg border text-sm transition-all ${
                            isSelected
                              ? "bg-blue-50 border-blue-400 text-blue-900 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-200"
                              : "bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <div
                            className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300 dark:border-gray-600"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="h-2.5 w-2.5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{course.title}</p>
                            <p className="text-xs text-gray-400 capitalize">{course.status.toLowerCase()}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedCourseIds.length > 0 && (
                  <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {selectedCourseIds.length} course{selectedCourseIds.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>

              <Separator />

              {/* Admin Notes */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                  Admin Notes{" "}
                  <span className="font-normal text-gray-400">(optional — included in email)</span>
                </Label>
                <Textarea
                  placeholder="e.g. Welcome aboard! We look forward to working with you on the JEE Advanced Chemistry course."
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                />
              </div>

              {/* Warning if no courses selected */}
              {selectedCourseIds.length === 0 && (
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <p>
                    No courses selected. You can approve without assigning courses now and assign them
                    later via the Courses button.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-1">
                <Button
                  variant="outline"
                  onClick={() => {
                    setApproveInstructor(null);
                    setApprovalNotes("");
                    setSelectedCourseIds([]);
                  }}
                  disabled={approving}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white min-w-[130px]"
                  onClick={handleApprove}
                  disabled={approving}
                >
                  {approving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Approve & Notify
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────────────────────── */}
      <Dialog open={!!editInstructor} onOpenChange={(o) => !o && setEditInstructor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Instructor</DialogTitle>
          </DialogHeader>
          {editInstructor && (
            <InstructorForm
              initial={editInstructor as Parameters<typeof InstructorForm>[0]["initial"]}
              onSuccess={() => {
                setEditInstructor(null);
                onRefresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Assign Courses Dialog (approved instructors) ─────────────────────── */}
      <Dialog open={!!assignInstructor} onOpenChange={(o) => !o && setAssignInstructor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Courses — {assignInstructor?.fullName}</DialogTitle>
            <DialogDescription>
              Add or remove course assignments for this instructor. Changes are admin-authorised only.
            </DialogDescription>
          </DialogHeader>

          {assignInstructor && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Assigned Courses</p>
                {assignInstructor.courseInstructors.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No courses assigned yet.</p>
                ) : (
                  <div className="space-y-2">
                    {assignInstructor.courseInstructors.map((ci) => (
                      <div
                        key={ci.courseId}
                        className="flex items-center justify-between p-2 rounded border text-sm bg-muted/30"
                      >
                        <span>{ci.course.title}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          disabled={removingCourseId === ci.courseId}
                          onClick={() => handleRemoveCourse(assignInstructor.id, ci.courseId)}
                        >
                          {removingCourseId === ci.courseId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {unassignedCourses.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Assign a Course</p>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 border rounded-md px-2 py-1 text-sm bg-background"
                      value={assigningCourseId}
                      onChange={(e) => setAssigningCourseId(e.target.value)}
                    >
                      <option value="">Select course...</option>
                      {unassignedCourses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.status})
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      disabled={!assigningCourseId || assignLoading}
                      onClick={handleAssignCourse}
                    >
                      <PlusCircle className="h-3 w-3 mr-1" />
                      {assignLoading ? "Assigning..." : "Assign"}
                    </Button>
                  </div>
                </div>
              )}

              {unassignedCourses.length === 0 && allCourses.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  All available courses are already assigned to this instructor.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ────────────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Instructor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this instructor and remove them from all assigned courses.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
