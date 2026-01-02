"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  // ListChecks,
  // MoreHorizontal,
  CheckCircle,
  FileQuestion,
  BookOpen,
  Search,
  Trash2,
  Eye,
  FileText,
  GripVertical,
  X,
  Save,
} from "lucide-react";

interface Content {
  id: string;
  title: string;
  description: string;
  order?: number;
  _count?: {
    lectures: number;
  };
}

interface ContentTableProps {
  courseId: string;
  contents: Content[];
  refresh: () => void;
}


  interface QuizStatusCellProps {
  contentId: string;
}

//component to show quiz status in content table
export const QuizStatusCell = ({ contentId }: QuizStatusCellProps) => {
  const [quizData, setQuizData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const res = await fetch(`/api/admin/contents/${contentId}/quiz`);
        if (res.ok) {
          const data = await res.json();
          setQuizData(data);
        }
      } catch (error) {
        console.error("Failed to fetch quiz data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [contentId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
          <FileQuestion className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>
        <span className="text-sm text-muted-foreground">Not added</span>
      </div>
    );
  }

  const questionCount = quizData.questions?.length || 0;
  
  return (
    <div className="flex items-center gap-2">
      <div className="p-1.5 bg-green-100 dark:bg-green-900/40 rounded-full">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-green-600 dark:text-green-400">
          {questionCount} question{questionCount !== 1 ? 's' : ''}
        </span>
        <span className="text-xs text-muted-foreground">
          Added
        </span>
      </div>
    </div>
  );
};



export default function ContentTable({
  courseId,
  contents,
  refresh,
}: ContentTableProps) {
  const [localContents, setLocalContents] = useState<Content[]>(contents);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [lectureCounts, setLectureCounts] = useState<Record<string, number>>(
    {}
  );

  // Initialize lectureCounts from contents._count (if present) so we don't always fetch
  useEffect(() => {
    const initial: Record<string, number> = {};
    for (const c of contents) {
      if (typeof c._count?.lectures === "number") {
        initial[c.id] = c._count!.lectures;
      }
    }
    // Only set if we found anything (preserve existing fetched counts)
    if (Object.keys(initial).length) {
      setLectureCounts((prev) => ({ ...initial, ...prev }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contents]); // only to pick up any _count values coming from server

  // Keep localContents synced with prop
  useEffect(() => {
    setLocalContents(contents);
    setHasChanges(false);
  }, [contents]);

  // Fetch lecture counts for contents that don't already have a count.
  useEffect(() => {
    if (!contents?.length) return;

    const abortController = new AbortController();
    let isMounted = true; // additional guard

    const contentsToFetch = contents.filter(
      (c) => typeof lectureCounts[c.id] !== "number"
    );

    if (!contentsToFetch.length) return; // nothing to do

    const fetchLectureCounts = async () => {
      try {
        const counts: Record<string, number> = {};
        // map to promises so we can parallelize
        const promises = contentsToFetch.map(async (content) => {
          try {
            const res = await fetch(
              `/api/admin/contents/${content.id}/lectures`,
              {
                signal: abortController.signal,
              }
            );

            if (!res.ok) {
              counts[content.id] = 0;
              return;
            }

            const lectures = await res.json();
            counts[content.id] = Array.isArray(lectures) ? lectures.length : 0;
          } catch (err: any) {
            if (err?.name === "AbortError") {
              // aborted, ignore
              return;
            }
            // on error assume 0
            counts[content.id] = 0;
          }
        });

        await Promise.all(promises);

        if (isMounted && !abortController.signal.aborted) {
          // merge with any previously-known counts
          setLectureCounts((prev) => ({ ...prev, ...counts }));
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Failed to fetch lecture counts:", err);
        }
      }
    };

    fetchLectureCounts();

    return () => {
      isMounted = false;
      abortController.abort();
    };
    // include lectureCounts intentionally so we only fetch missing ones
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    contents /* lectureCounts intentionally omitted to avoid refetch loops */,
  ]);

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      const response = await fetch(`/api/admin/contents/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete content");
      toast.success("Content deleted successfully");
      // remove local lectureCount to avoid stale showing while refresh occurs
      setLectureCounts((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      await refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete content");
    } finally {
      setDeleting(null);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContent) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contents/${editingContent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingContent.title,
          description: editingContent.description,
          order: Number(editingContent.order) || 0,
        }),
      });

      if (!res.ok) throw new Error("Failed to update content");

      toast.success("Content updated successfully");
      setOpen(false);
      setEditingContent(null);
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update content");
    } finally {
      setLoading(false);
    }
  };




const columns = useMemo<ColumnDef<Content>[]>(
  () => [
    {
      accessorKey: "title",
      header: () => <span className="font-medium">Title</span>,
      cell: ({ row }) => {
        const content = row.original;
        const lectureCount = lectureCounts[content.id];
        const truncatedTitle = content.title.length > 30 
          ? `${content.title.substring(0, 30)}...` 
          : content.title;

        return (
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="rounded-xl">
              #{row.index + 1}
            </Badge>

            <div className="flex flex-col min-w-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium truncate max-w-[200px]">
                      {truncatedTitle}
                    </span>
                  </TooltipTrigger>
                  {content.title.length > 30 && (
                    <TooltipContent>
                      <p className="max-w-xs break-words">{content.title}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <span className="text-xs text-muted-foreground flex items-center gap-2">
                {lectureCount === undefined ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>{`${lectureCount} lecture${
                    lectureCount !== 1 ? "s" : ""
                  }`}</>
                )}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: () => <span className="font-medium">Description</span>,
      cell: ({ row }) => {
        const description = row.original.description || "";
        const truncatedDesc = description.length > 40 
          ? `${description.substring(0, 40)}...` 
          : description;

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-muted-foreground line-clamp-2 max-w-[300px]">
                  {truncatedDesc}
                </p>
              </TooltipTrigger>
              {description.length > 40 && (
                <TooltipContent>
                  <p className="max-w-xs break-words">{description}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "order",
      header: () => <span className="font-medium">Order</span>,
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue<number>() ?? 0}</span>
      ),
    },
    {
      id: "quiz",
      header: () => <span className="font-medium">Quiz</span>,
      cell: ({ row }) => {
        const content = row.original;
        return <QuizStatusCell contentId={content.id} />;
      },
      enableSorting: false,
    },
    {
      id: "actions",
      header: () => <span className="font-medium">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const content = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            {/* View Lectures */}
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link
                href={{
                  pathname: `/admin/contents/${content.id}/lectures`,
                  query: { contentTitle: content.title },
                }}
              >
                <Eye className="h-4 w-4" />
                <span>Lectures</span>
              </Link>
            </Button>

            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link
                href={{
                  pathname: `/admin/contents/${content.id}/quiz`,
                  query: { contentTitle: content.title, courseId },
                }}
              >
                <BookOpen className="h-4 w-4" />
                <span>Quiz</span>
              </Link>
            </Button>

            {/* Edit */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                setEditingContent(content);
                setOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
              {/* Edit */}
            </Button>

            {/* Delete with confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  disabled={!!deleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {/* Delete */}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this content?</AlertDialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    This action cannot be undone. The content and all
                    associated lectures will be permanently removed.
                  </p>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={!!deleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => handleDelete(content.id)}
                    disabled={!!deleting}
                  >
                    {deleting === content.id ? "Deleting…" : "Yes, delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ],
  // re-compute when deleting or lectureCounts change
  [deleting, lectureCounts]
);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function SortableRow({ content, children }: { content: Content; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: content.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (
      <TableRow ref={setNodeRef} style={style} className={isDragging ? "bg-muted/50" : ""}>
        <TableCell className="text-center py-4">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing flex items-center justify-center p-2 hover:bg-muted/50 rounded">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        </TableCell>
        {children}
      </TableRow>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalContents((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        setHasChanges(true);
        return newOrder;
      });
    }
  };

  const handleSaveOrder = async () => {
    try {
      setIsSaving(true);
      const contentOrders = localContents.map((c, i) => ({ id: c.id, order: i + 1 }));
      const res = await fetch('/api/admin/contents/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentOrders }),
      });
      if (!res.ok) throw new Error('Failed to reorder contents');
      toast.success('Content order updated');
      setHasChanges(false);
      refresh();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save content order');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelReorder = () => {
    setLocalContents(contents);
    setHasChanges(false);
  };

  const table = useReactTable({
    data: localContents,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "")
        .toLowerCase()
        .trim();
      if (!q) return true;
      const { title, description } = row.original as Content;
      return (
        title?.toLowerCase().includes(q) ||
        description?.toLowerCase().includes(q)
      );
    },
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [{ id: "order", desc: false }],
    },
  });

  // derived pagination numbers (safe)
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const currentRows = table.getRowModel().rows.length;
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const start = totalFiltered === 0 ? 0 : pageIndex * pageSize + 1;
  const end = totalFiltered === 0 ? 0 : pageIndex * pageSize + currentRows;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title or description…"
            value={globalFilter}
            onChange={(e) => {
              table.setPageIndex(0); // reset to first page on search
              setGlobalFilter(e.target.value);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(v) => table.setPageSize(Number(v))}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      {hasChanges && (
        <div className="border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center">
                <GripVertical className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-100">Unsaved Changes</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">You have reordered contents. Click "Save Order" to apply changes.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelReorder} disabled={isSaving} className="gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSaveOrder} disabled={isSaving} className="gap-2 bg-amber-600 hover:bg-amber-700">
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Order'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/40 backdrop-blur supports-[backdrop-filter]:bg-muted/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <TableHead className="text-center py-4 font-semibold w-[40px]">
                  <GripVertical className="h-4 w-4 mx-auto text-muted-foreground" />
                </TableHead>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-1 select-none",
                          header.column.getCanSort() && "cursor-pointer"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getIsSorted() === "asc" && (
                          <span>▲</span>
                        )}
                        {header.column.getIsSorted() === "desc" && (
                          <span>▼</span>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localContents.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <SortableRow key={row.original.id} content={row.original}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="text-center py-4 group-hover:bg-muted/10 transition-colors">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </SortableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No contents found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </SortableContext>
          </DndContext>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{start}</span> –{" "}
          <span className="font-medium">{end}</span> of{" "}
          <span className="font-medium">{totalFiltered}</span>
        </p>

        <div className="flex items-center gap-1 sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              table.setPageIndex(Math.max(0, table.getPageCount() - 1))
            }
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
          </DialogHeader>

          {editingContent && (
            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input
                  value={editingContent.title}
                  onChange={(e) =>
                    setEditingContent({
                      ...editingContent,
                      title: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={editingContent.description || ""}
                  onChange={(e) =>
                    setEditingContent({
                      ...editingContent,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={editingContent.order ?? 0}
                  onChange={(e) =>
                    setEditingContent({
                      ...editingContent,
                      order: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
