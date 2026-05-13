"use client";

import { useState } from "react";
import Image from "next/image";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";
import { Pencil, Trash2, BookOpen, UserCircle, PlusCircle, X } from "lucide-react";
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
  allCourses: { id: string; title: string; status: string }[];
  onRefresh: () => void;
}

export default function InstructorTable({
  instructors,
  allCourses,
  onRefresh,
}: InstructorTableProps) {
  const [editInstructor, setEditInstructor] = useState<Instructor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [assignInstructor, setAssignInstructor] = useState<Instructor | null>(null);
  const [assigningCourseId, setAssigningCourseId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [removingCourseId, setRemovingCourseId] = useState<string | null>(null);

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
      toast.success("Course assigned to instructor");
      setAssigningCourseId("");
      onRefresh();
      // Refresh assignInstructor state
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
      toast.success("Course removed from instructor");
      onRefresh();
      const updated = await fetch(`/api/admin/instructors/${instructorId}`).then((r) => r.json());
      setAssignInstructor(updated);
    } catch {
      toast.error("Failed to remove course");
    } finally {
      setRemovingCourseId(null);
    }
  };

  // Courses not yet assigned to this instructor
  const unassignedCourses = assignInstructor
    ? allCourses.filter(
        (c) => !assignInstructor.courseInstructors.some((ci) => ci.courseId === c.id)
      )
    : [];

  if (instructors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <UserCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">No instructors yet</p>
        <p className="text-sm text-muted-foreground">Create your first instructor to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instructor</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instructors.map((inst) => (
              <TableRow key={inst.id}>
                {/* Instructor column */}
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
                  <p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
                    {inst.title || "—"}
                  </p>
                </TableCell>

                {/* Courses assigned */}
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {inst.courseInstructors.length === 0 ? (
                      <span className="text-xs text-muted-foreground">None assigned</span>
                    ) : (
                      inst.courseInstructors.slice(0, 2).map((ci) => (
                        <Badge key={ci.courseId} variant="outline" className="text-xs">
                          {ci.course.title.length > 18
                            ? ci.course.title.substring(0, 18) + "…"
                            : ci.course.title}
                        </Badge>
                      ))
                    )}
                    {inst.courseInstructors.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{inst.courseInstructors.length - 2} more
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge
                    className={
                      inst.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }
                  >
                    {inst.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAssignInstructor(inst)}
                      title="Manage courses"
                    >
                      <BookOpen className="h-3 w-3 mr-1" /> Courses
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setEditInstructor(inst)}
                      title="Edit"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => setDeleteId(inst.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
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

      {/* Assign Courses Dialog */}
      <Dialog open={!!assignInstructor} onOpenChange={(o) => !o && setAssignInstructor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Manage Courses — {assignInstructor?.fullName}
            </DialogTitle>
          </DialogHeader>

          {assignInstructor && (
            <div className="space-y-4">
              {/* Currently assigned */}
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
                          onClick={() =>
                            handleRemoveCourse(assignInstructor.id, ci.courseId)
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign new course */}
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

      {/* Delete Confirm */}
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
