"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Search, 
  Upload, 
  Plus, 
  Copy, 
  Edit, 
  Trash2, 
  FileText, 
  Image, 
  Video, 
  File,
  CheckCircle,
  Loader2
} from "lucide-react";

interface SettingsUpload {
  id: string;
  title: string;
  url: string;
  fileType: string;
  purpose: string;
  fileName: string;
  publicId: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const [uploads, setUploads] = useState<SettingsUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    purpose: "website-logo",
    file: null as File | null,
  });

  // Fetch all uploads
  const fetchUploads = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings/upload");
      if (!response.ok) throw new Error("Failed to fetch uploads");
      const data = await response.json();
      setUploads(data);
    } catch (error) {
      console.error("Error fetching uploads:", error);
      toast.error("Failed to load uploads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  // Handle file upload
  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.title || !uploadForm.purpose) {
      toast.error("Please fill all fields and select a file");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("title", uploadForm.title);
      formData.append("purpose", uploadForm.purpose);

      const response = await fetch("/api/admin/settings/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      toast.success("File uploaded successfully!");
      setIsUploadDialogOpen(false);
      setUploadForm({ title: "", purpose: "website-logo", file: null });
      fetchUploads(); // Refresh the list
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  // Handle file delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      setDeleteLoading(id);
      const response = await fetch(`/api/admin/settings/upload/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      toast.success("File deleted successfully!");
      fetchUploads(); // Refresh the list
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete file");
    } finally {
      setDeleteLoading(null);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("URL copied to clipboard!");
  };

  // Filter uploads based on search
  const filteredUploads = uploads.filter(upload =>
    upload.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    upload.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
    upload.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get file type icon
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case "image": return <Image className="w-4 h-4" />;
      case "video": return <Video className="w-4 h-4" />;
      case "raw": return <FileText className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  // Get purpose badge color
  const getPurposeBadge = (purpose: string) => {
    const colors: { [key: string]: string } = {
      "website-logo": "bg-blue-100 text-blue-800",
      "banner": "bg-green-100 text-green-800",
      "course-material": "bg-purple-100 text-purple-800",
      "profile-picture": "bg-orange-100 text-orange-800",
      "document": "bg-gray-100 text-gray-800",
    };
    return colors[purpose] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">File Management</h1>
          <p className="text-gray-600">Manage your static files and URLs</p>
        </div>
        
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
              <Plus className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload New File</DialogTitle>
              <DialogDescription>
                Upload files to Cloudinary and get static URLs for your application.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="e.g., Main Logo, Course Banner"
                />
              </div>
              
              <div>
                <Label htmlFor="purpose">Purpose *</Label>
                <Select value={uploadForm.purpose} onValueChange={(value) => setUploadForm({ ...uploadForm, purpose: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website-logo">Website Logo</SelectItem>
                    <SelectItem value="banner">Banner Image</SelectItem>
                    <SelectItem value="course-material">Course Material</SelectItem>
                    <SelectItem value="profile-picture">Profile Picture</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                  className="cursor-pointer"
                />
                {uploadForm.file && (
                  <p className="text-sm text-gray-600 mt-1">Selected: {uploadForm.file.name}</p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={uploading || !uploadForm.file || !uploadForm.title}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by title, purpose, or filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Uploads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
          <CardDescription>
            {filteredUploads.length} file{filteredUploads.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : filteredUploads.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No files found. Upload your first file to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileTypeIcon(upload.fileType)}
                          <div>
                            <p className="font-medium">{upload.title}</p>
                            <p className="text-sm text-gray-500">{upload.fileName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getPurposeBadge(upload.purpose)}>
                          {upload.purpose.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {upload.fileType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <Textarea
                            value={upload.url}
                            readOnly
                            className="h-8 text-xs font-mono resize-none"
                            onClick={(e) => e.currentTarget.select()}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(upload.url)}
                            className="shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(upload.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(upload.url)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <Link href={upload.url} target="_blank" rel="noopener noreferrer">
                              <FileText className="w-3 h-3 mr-1" />
                              View
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(upload.id)}
                            disabled={deleteLoading === upload.id}
                          >
                            {deleteLoading === upload.id ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3 mr-1" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common file management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Image className="w-6 h-6" />
              Upload Logo
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <FileText className="w-6 h-6" />
              Upload PDF
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Video className="w-6 h-6" />
              Upload Video
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}