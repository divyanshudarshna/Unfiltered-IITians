"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import {
  AlertCircle,
  Edit2,
  Trash2,
  ArrowLeft,
  ArrowRight,
  User,
  Star,
  Upload,
  X,
} from "lucide-react";

type Testimonial = {
  id: string;
  name: string;
  role: string;
  content: string;
  image?: string;
  rating?: number;
  createdAt: string;
};
import Image from "next/image";

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Testimonial | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [form, setForm] = useState({
    name: "",
    role: "",
    content: "",
    image: "",
    rating: 5,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Fetch testimonials
  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/testimonials");
      if (!res.ok) throw new Error("Failed to fetch testimonials");
      const data = await res.json();
      setTestimonials(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load testimonials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setForm({ ...form, image: data.url });
      setImagePreview(URL.createObjectURL(file));
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      handleImageUpload(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm({ ...form, image: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Create testimonial
  // Create testimonial
  const handleCreate = async () => {
    try {
      setLoading(true);
      let response;

      if (imageFile) {
        // If we have a file to upload, use FormData
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("role", form.role);
        formData.append("content", form.content);
        formData.append("rating", form.rating.toString());
        formData.append("file", imageFile);

        response = await fetch("/api/testimonials", {
          method: "POST",
          body: formData,
        });
      } else {
        // If we're using an existing URL or no image, use JSON
        response = await fetch("/api/testimonials", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            role: form.role,
            content: form.content,
            rating: form.rating,
            image: form.image || null,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create testimonial");
      }

      setCreateOpen(false);
      setForm({ name: "", role: "", content: "", image: "", rating: 5 });
      setImageFile(null);
      setImagePreview(null);
      fetchTestimonials();
      setLoading(false);

      toast.success("Testimonial created successfully");
    } catch (err) {
      setLoading(false);
      console.error("Create error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create testimonial"
      );
    }
  };

  // Edit testimonial
  // Edit testimonial
  const handleEdit = async () => {
    if (!selected) return;
    try {
      // Prepare the data for the API
      const updateData = {
        name: form.name,
        role: form.role,
        content: form.content,
        rating: form.rating,
        image: form.image || null, // Send null if no image
      };

      const res = await fetch(`/api/testimonials/${selected.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update testimonial");
      }

      setEditOpen(false);
      setSelected(null);
      setImageFile(null);
      setImagePreview(null);
      fetchTestimonials();

      toast.success("Testimonial updated successfully");
    } catch (err) {
      console.error("Edit error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update testimonial"
      );
    }
  };

  // Delete testimonial
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    try {
      const res = await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTestimonials((prev) => prev.filter((t) => t.id !== id));
        toast.success("Testimonial deleted successfully");
      } else throw new Error("Delete failed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete testimonial");
    }
  };

  // Open edit modal
  const openEditModal = (testimonial: Testimonial) => {
    setSelected(testimonial);
    setForm({
      name: testimonial.name,
      role: testimonial.role,
      content: testimonial.content,
      image: testimonial.image || "",
      rating: testimonial.rating || 5,
    });
    setImagePreview(testimonial.image || null);
    setImageFile(null);
    setEditOpen(true);
  };

  // Reset form when modal closes
  const resetForm = () => {
    setForm({ name: "", role: "", content: "", image: "", rating: 5 });
    setImageFile(null);
    setImagePreview(null);
  };

  // Columns
  const columns: ColumnDef<Testimonial>[] = [
    {
      accessorKey: "image",
      header: "Image",
      cell: (info) => {
        const imageUrl = info.getValue() as string | undefined;
        return (
          <div className="w-10 h-10 rounded-full overflow-hidden border flex items-center justify-center bg-gray-100">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Profile"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // If image fails to load, show default avatar
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            ) : null}
            <User
              className={`w-5 h-5 text-muted-foreground ${
                imageUrl ? "hidden" : ""
              }`}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: (info) => (
        <span className="font-medium">{info.getValue() as string}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: (info) => (
        <Badge variant="outline">{info.getValue() as string}</Badge>
      ),
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: (info) => {
        const rating = info.getValue() as number | undefined;
        if (!rating) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
            <span className="ml-1 text-sm">({rating})</span>
          </div>
        );
      },
    },
    {
      accessorKey: "content",
      header: "Message",
      cell: (info) => {
        const value = info.getValue() as string | undefined;
        if (!value) return <span className="text-muted-foreground">—</span>;

        const truncated =
          value.length > 40 ? value.slice(0, 40) + "..." : value;

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-pointer">{truncated}</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{value}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },

    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: (info) => (
        <span className="text-sm text-muted-foreground">
          {new Date(info.getValue() as string).toLocaleDateString("en-IN")}
        </span>
      ),
    },

    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditModal(t)}
            >
              <Edit2 className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(t.id)}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        );
      },
    },
  ];

  // Table instance
  const table = useReactTable({
    data: testimonials,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _, filterValue) => {
      const search = filterValue.toLowerCase();
      return (
        row.getValue("name").toString().toLowerCase().includes(search) ||
        row.getValue("role").toString().toLowerCase().includes(search) ||
        row.getValue("content").toString().toLowerCase().includes(search)
      );
    },
  });

  if (loading) return <div className="p-6">Loading testimonials...</div>;
  if (error)
    return (
      <div className="p-6 text-red-600 flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" /> {error}
      </div>
    );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Testimonials Management</h1>
        <Button onClick={() => setCreateOpen(true)}>+ Add Testimonial</Button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder="Search testimonials..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} found
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-gray-900 text-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                <TableRow key={row.id}>
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
                  No testimonials found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Create Modal */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Testimonial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Role *</Label>
              <Input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Rating</Label>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.5"
                value={form.rating.toString()}
                onChange={(e) =>
                  setForm({ ...form, rating: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <Label>Profile Image</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? "Uploading..." : "Select Image"}
                  </Button>
                  {(imagePreview || form.image) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {(imagePreview || form.image) && (
                  <div className="mt-2">
                    <div className="w-20 h-20 rounded-full overflow-hidden border">
                      <Image
                        src={imagePreview || form.image}
                        alt="Preview"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={uploading}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setSelected(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Testimonial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Role *</Label>
              <Input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Rating</Label>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.5"
                value={form.rating.toString()}
                onChange={(e) =>
                  setForm({ ...form, rating: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <Label>Profile Image</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? "Uploading..." : "Select Image"}
                  </Button>
                  {(imagePreview || form.image) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {(imagePreview || form.image) && (
                  <div className="mt-2">
                    <div className="w-20 h-20 rounded-full overflow-hidden border">
                      <Image
                        src={imagePreview || form.image}
                        alt="Preview"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit} disabled={uploading}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
