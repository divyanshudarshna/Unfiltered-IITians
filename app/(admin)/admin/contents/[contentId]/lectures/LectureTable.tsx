"use client";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Play,
  FileText,
  Video,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  File,
  Eye,
  X,
} from "lucide-react";
import Link from "next/link";

interface Lecture {
  id: string;
  title: string;
  videoUrl?: string;
  pdfUrl?: string;
  summary?: string;
  order: number;
}

interface LectureTableProps {
  lectures: Lecture[];
  refresh: () => void;
  contentId: string;
}

export default function LectureTable({
  lectures,
  refresh,
  contentId,
}: LectureTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [summaryPreview, setSummaryPreview] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      const res = await fetch(`/api/admin/lectures/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Lecture deleted successfully");
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete lecture");
    } finally {
      setDeleting(null);
      setDeleteConfirm(null);
    }
  };

  const handlePlayVideo = (videoUrl: string) => {
    setVideoPreview(videoUrl);
  };

  const handlePdfPreview = (pdfUrl: string) => {
    setPdfPreview(pdfUrl);
  };

  const handleSummaryPreview = (summary: string) => {
    setSummaryPreview(summary);
  };

  const columns: ColumnDef<Lecture>[] = [
    {
      id: "serial",
      header: "S.No",
      cell: ({ row }) => (
        <div className="text-center font-medium text-muted-foreground">
          {row.index + 1}
        </div>
      ),
      size: 60,
    },
    {
      accessorKey: "title",
      header: "Lecture Title",
      cell: ({ row }) => (
        <div className="font-medium line-clamp-2 max-w-[200px]">
          {row.getValue("title")}
        </div>
      ),
    },
    {
      id: "video",
      header: "Video",
      cell: ({ row }) => {
        const lecture = row.original;
        return lecture.videoUrl ? (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePlayVideo(lecture.videoUrl!)}
              className="h-8 w-8 group relative"
              title="Preview Video"
            >
              <Play className="h-4 w-4 text-blue-500" />
              <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                Preview
              </span>
            </Button>
          </div>
        ) : (
          <div className="flex justify-center text-muted-foreground">
            <Video className="h-4 w-4" />
          </div>
        );
      },
      size: 80,
    },
    {
      id: "pdf",
      header: "PDF",
      cell: ({ row }) => {
        const lecture = row.original;
        return lecture.pdfUrl ? (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePdfPreview(lecture.pdfUrl!)}
              className="h-8 w-8 group relative"
              title="Preview PDF"
            >
              <FileText className="h-4 w-4 text-green-500" />
              <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                Preview
              </span>
            </Button>
          </div>
        ) : (
          <div className="flex justify-center text-muted-foreground">
            <File className="h-4 w-4" />
          </div>
        );
      },
      size: 80,
    },
    {
      id: "summary",
      header: "Summary",
      cell: ({ row }) => {
        const lecture = row.original;
        return lecture.summary ? (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSummaryPreview(lecture.summary!)}
              className="h-8 w-8 group relative"
              title="Preview Summary"
            >
              <Eye className="h-4 w-4 text-purple-500" />
              <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                Preview
              </span>
            </Button>
          </div>
        ) : (
          <div className="flex justify-center text-muted-foreground">
            <span className="text-xs">No summary</span>
          </div>
        );
      },
      size: 80,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const lecture = row.original;
        return (
          <div className="flex gap-2 justify-center">
         <Link href={`/admin/contents/${contentId}/lectures/edit?lectureId=${lecture.id}`}>
  <Button size="sm" variant="outline" className="h-8 gap-1">
    <Edit className="h-3 w-3" />
    Edit
  </Button>
</Link>
            <Button
              size="sm"
              variant="destructive"
              disabled={deleting === lecture.id}
              onClick={() => setDeleteConfirm(lecture.id)}
              className="h-8 gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </div>
        );
      },
      size: 150,
    },
  ];

  const table = useReactTable({
    data: lectures,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lectures..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} lectures found
        </div>
      </div>

      {/* Video Preview Modal */}
      <Dialog open={!!videoPreview} onOpenChange={() => setVideoPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Video Preview</DialogTitle>
            <DialogDescription>
              Preview of the lecture video. Downloading is restricted.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
           {videoPreview ? (
  <video
    src={videoPreview}
    controls
    controlsList="nodownload"
    className="w-full max-h-[70vh] rounded-md"
  />
) : (
  <div className="flex items-center justify-center h-48 text-muted-foreground">
    <Video className="h-12 w-12 mb-4" />
    <p>No video available for preview</p>
  </div>
)}
          </div>
          <DialogFooter>
            <Button onClick={() => setVideoPreview(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Modal */}
      <Dialog open={!!pdfPreview} onOpenChange={() => setPdfPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>PDF Preview</DialogTitle>
            <DialogDescription>
              Preview of the lecture materials. Downloading is restricted.
            </DialogDescription>
          </DialogHeader>
       {pdfPreview ? (
  <iframe
    src={pdfPreview}
    className="w-full h-full border rounded-md"
    frameBorder="0"
  />
) : (
  <div className="flex items-center justify-center h-full text-muted-foreground">
    <FileText className="h-12 w-12 mb-4" />
    <p>No PDF available for preview</p>
  </div>
)}
          <DialogFooter>
            <Button onClick={() => setPdfPreview(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Preview Modal */}
      <Dialog
        open={!!summaryPreview}
        onOpenChange={() => setSummaryPreview(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lecture Summary</DialogTitle>
            <DialogDescription>
              Overview of the lecture content
            </DialogDescription>
          </DialogHeader>
          <div
            className="prose prose-sm max-h-96 overflow-y-auto p-4 border rounded-md"
            dangerouslySetInnerHTML={{ __html: summaryPreview || "" }}
          />
          <DialogFooter>
            <Button onClick={() => setSummaryPreview(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              lecture and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting === deleteConfirm ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="text-center"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-center py-3">
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
                  className="text-center py-8 text-muted-foreground"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Video className="h-12 w-12 opacity-50" />
                    <p>No lectures found</p>
                    <p className="text-sm">
                      Create your first lecture to get started
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
