"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash, Save, RefreshCw, ArrowLeft, Eye, Search, FileText } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface CourseDetail {
  id: string;
  title: string;
  description: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
}

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [details, setDetails] = useState<CourseDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [previewDetail, setPreviewDetail] = useState<CourseDetail | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const pageSize = 5;

  // Fetch course info and its modules
  async function fetchCourseData() {
    setLoading(true);
    try {
      const [courseRes, detailsRes] = await Promise.all([
        fetch(`/api/courses/${id}`),
        fetch(`/api/admin/course-details?courseId=${id}`),
      ]);

      if (!courseRes.ok) throw new Error("Failed to fetch course");
      if (!detailsRes.ok) throw new Error("Failed to fetch modules");

      const courseData = await courseRes.json();
      const detailsData = await detailsRes.json();

      setCourse(courseData);
      setDetails(detailsData || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load course or modules");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) fetchCourseData();
  }, [id]);

  // Filtered and paginated modules
  const filtered = details.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.description?.toLowerCase() || "").includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Add new module
  async function handleAdd() {
    if (!newTitle.trim()) {
      toast.error("Module title is required");
      return;
    }

    try {
      const res = await fetch("/api/admin/course-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: id, title: newTitle, description: newDescription }),
      });

      if (!res.ok) throw new Error("Failed to add module");

      const created = await res.json();
      setDetails((prev) => [...prev, created]);
      setNewTitle("");
      setNewDescription("");
      toast.success("Module added successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add module");
    }
  }

  // Update module
  async function handleUpdate(detail: CourseDetail) {
    setSavingId(detail.id);
    try {
      const res = await fetch(`/api/admin/course-details/${detail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: detail.title, description: detail.description }),
      });

      if (!res.ok) throw new Error("Failed to update module");
      toast.success("Module updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update module");
    } finally {
      setSavingId(null);
    }
  }

  // Delete module
  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this module?")) return;
    try {
      const res = await fetch(`/api/admin/course-details/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete module");

      setDetails((prev) => prev.filter((d) => d.id !== id));
      toast.success("Module deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete module");
    }
  }

  // Open preview dialog
  function openPreview(detail: CourseDetail) {
    setPreviewDetail(detail);
    setIsPreviewOpen(true);
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/course-details")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{course?.title || "Course Modules"}</h1>
            {course?.description && (
              <p className="text-muted-foreground mt-1">{course.description}</p>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="px-3 py-1 text-sm">
          <FileText className="mr-1 h-3 w-3" />
          {details.length} module{details.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Search and Refresh */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchCourseData} className="shrink-0">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Add Module Card */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Module
          </CardTitle>
          <CardDescription>Create a new module for this course</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="module-title">Module Title</Label>
            <Input
              id="module-title"
              placeholder="Enter module title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="module-description">Module Description</Label>
            <Textarea
              id="module-description"
              placeholder="Enter module description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={handleAdd} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Module
          </Button>
        </CardContent>
      </Card>

      {/* Modules Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Course Modules</CardTitle>
          <CardDescription>
            Manage and edit modules for this course. {filtered.length > 0 && `Showing ${paginated.length} of ${filtered.length} modules`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-24" />
                </div>
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No modules found</h3>
              <p className="text-muted-foreground mt-2">
                {search ? "Try adjusting your search terms" : "Get started by adding your first module"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[35%]">Title</TableHead>
                      <TableHead className="w-[50%]">Description</TableHead>
                      <TableHead className="w-[15%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((detail) => (
                      <TableRow key={detail.id} className="group hover:bg-muted/50">
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              value={detail.title}
                              onChange={(e) => {
                                const updated = [...details];
                                const idx = updated.findIndex((d) => d.id === detail.id);
                                updated[idx].title = e.target.value;
                                setDetails(updated);
                              }}
                              className="font-medium border-none focus:ring-1 focus:ring-primary"
                            />
                            <div className="text-xs text-muted-foreground truncate max-w-[200px] lg:max-w-[300px]">
                              {detail.title}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Textarea
                              value={detail.description || ""}
                              onChange={(e) => {
                                const updated = [...details];
                                const idx = updated.findIndex((d) => d.id === detail.id);
                                updated[idx].description = e.target.value;
                                setDetails(updated);
                              }}
                              className="min-h-[40px] border-none focus:ring-1 focus:ring-primary resize-none"
                              rows={1}
                            />
                            <div className="text-xs text-muted-foreground truncate max-w-[300px] lg:max-w-[400px]">
                              {detail.description || "No description"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdate(detail)}
                              disabled={savingId === detail.id}
                              title="Save changes"
                            >
                              <Save className={`h-4 w-4 ${savingId === detail.id ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPreview(detail)}
                              title="Preview module"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(detail.id)}
                              title="Delete module"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum = i + Math.max(1, currentPage - 2);
                        if (pageNum > totalPages) return null;
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              isActive={currentPage === pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="text-center text-sm text-muted-foreground mt-2">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Module Preview
            </DialogTitle>
            <DialogDescription>
              Preview of the module content
            </DialogDescription>
          </DialogHeader>
          {previewDetail && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <p className="mt-1 text-sm border-l-2 border-primary pl-3 py-1 bg-muted/50 rounded-r">
                  {previewDetail.title}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="mt-1 text-sm border-l-2 border-primary pl-3 py-1 bg-muted/50 rounded-r whitespace-pre-wrap">
                  {previewDetail.description || "No description provided"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}