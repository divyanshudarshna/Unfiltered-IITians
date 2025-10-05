"use client";

import { useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent,DialogHeader,DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import CourseForm from "./CourseForm";
import Link from "next/link";
import {
  BookOpen,
  TicketPercent,
  Pencil,
  Trash2,
  Layers,
  Users,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description?: string;
  price: number;
  actualPrice?: number | null;
  durationMonths: number;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  order?: number;
}

interface CourseTableProps {
  courses: Course[];
  refresh: () => void;
}

export default function CourseTable({ courses, refresh }: CourseTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const [contentCounts, setContentCounts] = useState<Record<string, number>>({});
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});

  // 🔄 Fetch contents + enrollments counts for each course
  useEffect(() => {
    const fetchCounts = async () => {
      const newContentCounts: Record<string, number> = {};
      const newEnrollCounts: Record<string, number> = {};

      await Promise.all(
        courses.map(async (course) => {
          try {
            // fetch contents count
            const resContents = await fetch(`/api/admin/courses/${course.id}/contents`);
            if (resContents.ok) {
              const contents = await resContents.json();
              newContentCounts[course.id] = contents.length || 0;
            }

            // fetch enrollments count
            const resEnrolls = await fetch(`/api/admin/courses/${course.id}/enrollments`);
            if (resEnrolls.ok) {
              const enrollments = await resEnrolls.json();
              newEnrollCounts[course.id] = enrollments.length || 0;
            }
          } catch (err) {
            console.error("Error fetching counts", err);
          }
        })
      );

      setContentCounts(newContentCounts);
      setEnrollCounts(newEnrollCounts);
    };

    if (courses.length) fetchCounts();
  }, [courses]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/courses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete course");

      toast.success("Course deleted successfully");
      refresh();
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    }
  };

  const handleReorderCourses = async (newOrder: Course[]) => {
    try {
      setIsReordering(true);
      
      const courseOrders = newOrder.map((course, index) => ({
        id: course.id,
        order: index + 1,
      }));

      const response = await fetch('/api/admin/courses/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseOrders }),
      });

      if (!response.ok) throw new Error('Failed to reorder courses');

      toast.success('Course order updated successfully');
      refresh();
    } catch (error) {
      console.error('Error reordering courses:', error);
      toast.error('Failed to update course order');
    } finally {
      setIsReordering(false);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newCourses = [...courses];
    [newCourses[index], newCourses[index - 1]] = [newCourses[index - 1], newCourses[index]];
    handleReorderCourses(newCourses);
  };

  const moveDown = (index: number) => {
    if (index === courses.length - 1) return;
    const newCourses = [...courses];
    [newCourses[index], newCourses[index + 1]] = [newCourses[index + 1], newCourses[index]];
    handleReorderCourses(newCourses);
  };

  const columns: ColumnDef<Course>[] = [
    {
      accessorKey: "order",
      header: "Order",
      cell: ({ row }) => (
        <Badge variant="outline" className="w-12 justify-center">
          {row.original.order || 0}
        </Badge>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => {
        const price = parseFloat(row.original.price.toString());
        const actual = row.original.actualPrice;

        return actual && actual > 0 ? (
          <div>
            <span className="line-through text-gray-500 mr-1">
              ₹{price.toLocaleString("en-IN")}
            </span>
            <span className="text-green-600 font-semibold">
              ₹{actual.toLocaleString("en-IN")}
            </span>
          </div>
        ) : (
          <span className="font-medium">
            ₹{price.toLocaleString("en-IN")}
          </span>
        );
      },
    },
    {
      accessorKey: "durationMonths",
      header: "Duration",
      cell: ({ row }) => {
        const duration = row.getValue("durationMonths") as number;
        return (
          <Badge variant="outline">
            {duration} {duration === 1 ? "month" : "months"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as Course["status"];
        switch (status) {
          case "PUBLISHED":
            return <Badge className="bg-green-100 text-green-700">Published</Badge>;
          case "DRAFT":
            return <Badge className="bg-yellow-100 text-yellow-700">Draft</Badge>;
          case "ARCHIVED":
            return <Badge className="bg-gray-200 text-gray-700">Archived</Badge>;
          default:
            return <Badge variant="outline">Unknown</Badge>;
        }
      },
    },
    {
      id: "contents",
      header: "Contents",
      cell: ({ row }) => {
        const count = contentCounts[row.original.id] || 0;
        return (
          <div className="flex items-center gap-1">
            <Layers className="h-4 w-4 text-blue-500" />
            <span>{count}</span>
          </div>
        );
      },
    },
    {
      id: "enrollments",
      header: "Enrollments",
      cell: ({ row }) => {
        const count = enrollCounts[row.original.id] || 0;
        return (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-purple-500" />
            <span>{count}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const course = row.original;
        const courseIndex = courses.findIndex(c => c.id === course.id);
        return (
          <div className="flex gap-1 flex-wrap">
            {/* Reorder buttons */}
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                onClick={() => moveUp(courseIndex)}
                disabled={courseIndex === 0 || isReordering}
                title="Move up"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                onClick={() => moveDown(courseIndex)}
                disabled={courseIndex === courses.length - 1 || isReordering}
                title="Move down"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>

            <Link href={`/admin/courses/${course.id}/contents`}>
              <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800">
                <BookOpen className="h-4 w-4" />
              </Button>
            </Link>

            <Link href={`/admin/courses/${course.id}/coupons`}>
              <Button size="sm" variant="ghost" className="text-amber-600 hover:text-amber-800">
                <TicketPercent className="h-4 w-4" />
              </Button>
            </Link>

            <Button
              size="sm"
              variant="ghost"
              className="text-green-600 hover:text-green-800"
              onClick={() => setEditingCourse(course)}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {/* Delete with confirmation */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to delete this course?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                course <span className="font-semibold">{course.title}</span> and
                all its data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(course.id)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: courses,
    columns,
    state: { sorting, columnFilters, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full mx-2">
      {/* Search */}
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter courses..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border ">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No courses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        
      </div>
  {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 mr-4 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    

     {/* Edit Modal */}
<Dialog open={!!editingCourse} onOpenChange={() => setEditingCourse(null)}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Edit Course</DialogTitle>
    </DialogHeader>

    {editingCourse && (
      <CourseForm
        course={editingCourse}
        onSuccess={() => {
          setEditingCourse(null);
          refresh();
        }}
      />
    )}
  </DialogContent>
</Dialog>

    </div>
  );
}
