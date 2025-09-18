"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableHead, 
  TableRow, 
  TableHeader, 
  TableCell, 
  TableBody 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  Edit, 
  Trash, 
  Eye, 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal,
  Star,
  Search
} from "lucide-react";
import { toast } from "sonner";

export default function DataTable() {
  const router = useRouter();
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [previewContent, setPreviewContent] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/success-stories?page=${page}&pageSize=${pageSize}&search=${search}&sortField=${sortField}&sortOrder=${sortOrder}`
      );
      const data = await res.json();
      setStories(data.stories);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load stories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, sortField, sortOrder]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
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

  const handlePreview = (content: string) => {
    setPreviewContent(content);
    setIsPreviewOpen(true);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronUp className="h-4 w-4 opacity-30" />;
    return sortOrder === "asc" ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  // Function to render star rating
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

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
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
                onChange={(e) => setSearch(e.target.value)}
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
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      <SortIcon field="name" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort("role")}
                  >
                    <div className="flex items-center gap-1">
                      Role
                      <SortIcon field="role" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort("rating")}
                  >
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
                  <TableHead>Content</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {search ? "No stories found matching your search." : "No stories found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  stories.map((s) => (
                    <TableRow key={s.id} className="group  ">
                      <TableCell>
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={s.image} alt={s.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getInitials(s.name)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {s.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {renderStars(s.rating)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {new Date(s.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(s.content)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2 ">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/admin/successStories/storiesForm?id=${s.id}`)
                            }
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(s.id)}
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

      {/* Pagination */}
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
                      onClick={() => setPage(p => Math.max(1, p - 1))}
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
                      onClick={() => setPage(p => p + 1)}
                      className={page >= Math.ceil(total / pageSize) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
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