"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import CourseForm from "./CourseForm";
import Link from "next/link";
interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  actualPrice: number;
  durationMonths: number;
}

interface CourseTableProps {
  courses: Course[];
  refresh: () => void;
}

export default function CourseTable({ courses, refresh }: CourseTableProps) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

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

  const columns: ColumnDef<Course>[] = [
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("price"));
        return (
          <div className="font-medium">
            ₹{price.toLocaleString("en-IN")}
          </div>
        );
      },
    },
    {
      accessorKey: "actualPrice",
      header: "Discounted",
      cell: ({ row }) => {
        const actual = parseFloat(row.getValue("actualPrice"));
        return (
          <div className="text-green-600 font-semibold">
            ₹{actual.toLocaleString("en-IN")}
          </div>
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
  id: "actions",
  header: "Actions",
  cell: ({ row }) => {
    const course = row.original;

    return (
      <div className="flex space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditingCourse(course)}
        >
          Edit
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleDelete(course.id)}
        >
          Delete
        </Button>

        <Link href={`/admin/courses/${course.id}/contents`}>
          <Button size="sm" variant="secondary">
            Manage Contents
          </Button>
        </Link>
      </div>
    );
  },
},

  ];

  const table = useReactTable({
    data: courses,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full">
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No courses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
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
