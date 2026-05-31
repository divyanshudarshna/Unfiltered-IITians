"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Edit,
  Trash,
  Eye,
  ChevronUp,
  ChevronDown,
  Star,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type StoryStatus = "pending" | "approved" | "rejected" | string;

interface StoryRow {
  id: string;
  name: string;
  role: string;
  content: string;
  image?: string;
  rating: number;
  approvalStatus: StoryStatus;
  submittedViaForm: boolean;
  createdAt: string;
}

interface StatusCounts {
  pending: number;
  approved: number;
  rejected: number;
  attention: number;
}

export default function DataTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [stories, setStories] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [previewContent, setPreviewContent] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    pending: 0,
    approved: 0,
    rejected: 0,
    attention: 0,
  });
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const filterFromQuery = searchParams.get("filter");
  const activeFilter =
    filterFromQuery === "attention" ||
    filterFromQuery === "pending" ||
    filterFromQuery === "rejected" ||
    filterFromQuery === "approved"
      ? filterFromQuery
      : "all";

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/success-stories?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}&sortField=${sortField}&sortOrder=${sortOrder}&status=${activeFilter}`
      );

      if (!res.ok) throw new Error("Failed to fetch stories");

      const data = await res.json();
      setStories(data.stories || []);
      setTotal(data.total || 0);
      setStatusCounts(
        data.statusCounts || {
          pending: 0,
          approved: 0,
          rejected: 0,
          attention: 0,
        }
      );
    } catch {
      toast.error("Failed to load stories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, sortField, sortOrder, activeFilter]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleFilterChange = (filter: "all" | "attention" | "pending" | "rejected" | "approved") => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "all") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }
    setPage(1);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this story?")) return;
    try {
      const res = await fetch(`/api/admin/success-stories/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Story deleted successfully");
        fetchData();
      } else {
        toast.error("Failed to delete story");
      }
    } catch {
      toast.error("Error deleting story");
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this success story?")) return;

    setApprovingId(id);
    try {
      const res = await fetch(`/api/admin/success-stories/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      toast.success("Story approved");
      fetchData();
    } catch {
      toast.error("Failed to approve story");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject this success story?")) return;

    setRejectingId(id);
    try {
      const res = await fetch(`/api/admin/success-stories/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      toast.success("Story rejected");
      fetchData();
    } catch {
      toast.error("Failed to reject story");
    } finally {
      setRejectingId(null);
    }
  };

  const handlePreview = (content: string) => {
    setPreviewContent(content);
    setIsPreviewOpen(true);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronUp className="h-4 w-4 opacity-30" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const renderStatusBadge = (status: StoryStatus) => {
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
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stories by name, role, or content..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8"
              />
            </div>
            <Button
              onClick={() => router.push("/admin/successStories/storiesForm")}
              className="w-full md:w-auto"
            >
              Add New Story
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: "all", label: "All" },
              { key: "attention", label: `Attention (${statusCounts.attention})` },
              { key: "pending", label: `Pending (${statusCounts.pending})` },
              { key: "rejected", label: `Rejected (${statusCounts.rejected})` },
              { key: "approved", label: `Approved (${statusCounts.approved})` },
            ].map((item) => (
              <Button
                key={item.key}
                size="sm"
                variant={activeFilter === item.key ? "default" : "outline"}
                onClick={() =>
                  handleFilterChange(
                    item.key as "all" | "attention" | "pending" | "rejected" | "approved"
                  )
                }
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin h-8 w-8" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Profile</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1">
                      Name
                      <SortIcon field="name" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("role")}>
                    <div className="flex items-center gap-1">
                      Role
                      <SortIcon field="role" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("rating")}>
                    <div className="flex items-center gap-1">
                      Rating
                      <SortIcon field="rating" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      <SortIcon field="createdAt" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {search ? "No stories found matching your search." : "No stories found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  stories.map((story) => (
                    <TableRow key={story.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={story.image} alt={story.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getInitials(story.name)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{story.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {story.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{renderStars(story.rating)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {new Date(story.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(story.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{renderStatusBadge(story.approvalStatus || "pending")}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(story.content)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/admin/successStories/storiesForm?id=${story.id}`)
                            }
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {story.approvalStatus !== "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(story.id)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-600 hover:bg-green-50"
                              disabled={approvingId === story.id}
                            >
                              {approvingId === story.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}

                          {story.approvalStatus !== "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(story.id)}
                              className="h-8 w-8 p-0 text-amber-600 hover:text-amber-600 hover:bg-amber-50"
                              disabled={rejectingId === story.id}
                            >
                              {rejectingId === story.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(story.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {stories.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{" "}
                <span className="font-medium">{Math.min(page * pageSize, total)}</span> of{" "}
                <span className="font-medium">{total}</span> entries
              </p>

              <Pagination className="w-full md:w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <div className="px-2 text-sm font-medium">
                      Page {page} of {Math.ceil(total / pageSize) || 1}
                    </div>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => p + 1)}
                      className={
                        page >= Math.ceil(total / pageSize)
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Story Content Preview</DialogTitle>
          </DialogHeader>
          <div
            className="prose prose-sm max-w-none mt-4 p-4 border rounded-md"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
