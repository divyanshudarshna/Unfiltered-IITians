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
  Download,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface Lecture {
  id: string;
  title: string;
  videoUrl?: string;
  youtubeEmbedUrl?: string;
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
          <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
            {row.index + 1}
          </Badge>
        </div>
      ),
      size: 60,
    },
    {
      accessorKey: "title",
      header: "Lecture Title",
      cell: ({ row }) => (
        <div className="font-medium line-clamp-1 max-w-[200px]">
          {row.getValue("title")}
        </div>
      ),
    },
    {
      id: "video",
      header: "Video",
      cell: ({ row }) => {
        const lecture = row.original;
        const hasCloudinaryVideo = !!lecture.videoUrl;
        const hasYouTubeVideo = !!lecture.youtubeEmbedUrl;
        
        if (hasCloudinaryVideo) {
          return (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handlePlayVideo(lecture.videoUrl!)}
                className="h-10 w-10 rounded-full transition-all duration-200 hover:scale-110 hover:bg-blue-100 dark:hover:bg-blue-900/30 group relative"
                title="Preview Cloudinary Video"
              >
                <Play className="h-5 w-5 text-blue-500 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                <span className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-background px-2 py-1 rounded-md border shadow-sm">
                  Cloudinary Video
                </span>
              </Button>
            </div>
          );
        }
        
        if (hasYouTubeVideo) {
          return (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(lecture.youtubeEmbedUrl!, '_blank')}
                className="h-10 w-10 rounded-full transition-all duration-200 hover:scale-110 hover:bg-red-100 dark:hover:bg-red-900/30 group relative"
                title="Open YouTube Video"
              >
                <svg className="h-5 w-5 text-red-500 transition-colors group-hover:text-red-600 dark:group-hover:text-red-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-background px-2 py-1 rounded-md border shadow-sm">
                  YouTube Video
                </span>
              </Button>
            </div>
          );
        }
        
        return (
          <div className="flex justify-center text-muted-foreground/50">
            <Video className="h-5 w-5" />
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
              className="h-10 w-10 rounded-full transition-all duration-200 hover:scale-110 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 group relative"
              title="Preview PDF"
            >
              <FileText className="h-5 w-5 text-emerald-500 transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
              <span className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-background px-2 py-1 rounded-md border shadow-sm">
                Preview PDF
              </span>
            </Button>
          </div>
        ) : (
          <div className="flex justify-center text-muted-foreground/50">
            <File className="h-5 w-5" />
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
              className="h-10 w-10 rounded-full transition-all duration-200 hover:scale-110 hover:bg-purple-100 dark:hover:bg-purple-900/30 group relative"
              title="Preview Summary"
            >
              <Eye className="h-5 w-5 text-purple-500 transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400" />
              <span className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-background px-2 py-1 rounded-md border shadow-sm">
                View Summary
              </span>
            </Button>
          </div>
        ) : (
          <div className="flex justify-center text-muted-foreground/50">
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
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 gap-1 transition-all hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
            </Link>
            <Button
              size="sm"
              variant="destructive"
              disabled={deleting === lecture.id}
              onClick={() => setDeleteConfirm(lecture.id)}
              className="h-8 gap-1 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting === lecture.id ? "Deleting..." : "Delete"}
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
    <div className="space-y-6">
      {/* Header and Search */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Lecture Management</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Manage and preview your course lectures
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground hidden md:block">
                {table.getFilteredRowModel().rows.length} lectures found
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search lectures..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10 w-full md:w-[280px]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Preview Modal */}
      <Dialog open={!!videoPreview} onOpenChange={() => setVideoPreview(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50"
              onClick={() => setVideoPreview(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {videoPreview ? (
              <div className="aspect-video bg-black">
                <video
                  src={videoPreview}
                  controls
                  controlsList="nodownload"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <Video className="h-12 w-12 mb-4" />
                <p>No video available for preview</p>
              </div>
            )}
          </div>
          <DialogFooter className="px-6 pb-6">
            <Button 
              onClick={() => setVideoPreview(null)}
              className="ml-auto"
            >
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Modal */}
      <Dialog open={!!pdfPreview} onOpenChange={() => setPdfPreview(null)}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              PDF Preview
            </DialogTitle>
            <DialogDescription>
              Preview of the lecture materials
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 p-6">
            {pdfPreview ? (
              <iframe
                src={pdfPreview}
                className="w-full h-full border rounded-md"
                frameBorder="0"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileText className="h-16 w-16 mb-4 opacity-50" />
                <p>No PDF available for preview</p>
              </div>
            )}
          </div>
          <DialogFooter className="px-6 pb-6 border-t pt-4">
            <Button 
              variant="outline" 
              onClick={() => setPdfPreview(null)}
            >
              Close
            </Button>
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
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-500" />
              Lecture Summary
            </DialogTitle>
            <DialogDescription>
              Overview of the lecture content
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-md p-4 max-h-[50vh] overflow-y-auto">
            {summaryPreview ? (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: summaryPreview }}
              />
            ) : (
              <p className="text-muted-foreground text-center py-8">No summary available</p>
            )}
          </div>
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
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Lecture
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              lecture and remove all associated content from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting === deleteConfirm ? "Deleting..." : "Delete Lecture"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Table */}
      <Card className="border shadow-sm overflow-hidden">
        {/* <div className="rounded-md border"> */}
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-slate-800 hover:bg-slate/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="text-center py-4 font-semibold text-foreground"
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
                  <TableRow 
                    key={row.id} 
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id} 
                        className="text-center py-4 group-hover:bg-muted/10 transition-colors"
                      >
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
                    className="text-center py-12 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center space-y-4">
                      <Video className="h-16 w-16 opacity-30" />
                      <div>
                        <p className="font-medium">No lectures found</p>
                        <p className="text-sm mt-1">
                          {globalFilter ? 'Try adjusting your search query' : 'Create your first lecture to get started'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        {/* </div> */}
      </Card>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()} • {table.getFilteredRowModel().rows.length} lectures
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}