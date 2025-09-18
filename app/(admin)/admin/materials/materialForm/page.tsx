// app/(admin)/admin/materials/materialForm/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Material, MaterialCategory } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileText,
  Loader2,
  Save,
  X,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
} from "lucide-react";

// Tiptap
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

export default function MaterialFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const materialId = searchParams.get("id");

  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    tags: [] as string[],
    content: "",
    pdfUrl: "",
    youtubeLink: "",
    subjectId: "",
    published: true,
  });

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // ✅ Setup Tiptap Editor
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: formData.content || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base focus:outline-none min-h-[150px] p-3",
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setFormData((prev) => ({ ...prev, content: editor.getHTML() }));
    },
  });

  // ✅ Load categories + material if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesRes = await fetch("/api/admin/material-categories");
        if (categoriesRes.ok) {
          const cats = await categoriesRes.json();
          setCategories(cats);
          if (!formData.subjectId) {
            setFormData((prev) => ({ ...prev, subjectId: cats[0]?.id || "" }));
          }
        }

        if (materialId) {
          const materialRes = await fetch(`/api/admin/materials/${materialId}`);
          if (materialRes.ok) {
            const material: Material = await materialRes.json();
            setFormData({
              title: material.title,
              slug: material.slug || "",
              tags: material.tags || [],
              content: material.content || "",
              pdfUrl: material.pdfUrl || "",
              youtubeLink: material.youtubeLink || "",
              subjectId: material.subjectId,
              published: material.published,
            });
            if (editor) {
              editor.commands.setContent(material.content || "");
            }
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
      } finally {
        setInitializing(false);
      }
    };

    fetchData();
  }, [materialId, editor]);

  // ✅ Handle PDF Upload
  const handlePdfUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const form = new FormData();
      form.append("file", file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error("Upload failed"));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));
      });

      xhr.open("POST", "/api/upload");
      xhr.send(form);

      const data = await uploadPromise;

      if (data.url) {
        setFormData((prev) => ({ ...prev, pdfUrl: data.url }));
        toast.success("PDF uploaded successfully");
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload PDF");
    } finally {
      setUploading(false);
    }
  };

  const removePdf = () => {
    setFormData((prev) => ({ ...prev, pdfUrl: "" }));
    toast.info("PDF removed");
  };

  // ✅ Handle Tags
  const handleAddTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  // ✅ Save
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      setLoading(true);

      const payload = { ...formData, content: editor?.getHTML() || "" };

      const url = materialId
        ? `/api/admin/materials/${materialId}`
        : "/api/admin/materials";

      const method = materialId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Save failed");
      }

      toast.success(`Material ${materialId ? "updated" : "created"} successfully`);
      router.push("/admin/materials");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save material");
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="container mx-auto py-10">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">
        {materialId ? "Edit Material" : "Add New Material"}
      </h1>

      <div className="space-y-6">
        {/* Title + Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter material title"
              required
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value }))
              }
              placeholder="unique-slug"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <Label>Tags</Label>
          <div className="flex gap-2 flex-wrap">
            {formData.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
          <Input
            placeholder="Type a tag and press Enter"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag((e.target as HTMLInputElement).value.trim());
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
        </div>

        {/* YouTube */}
        <div>
          <Label>YouTube Link</Label>
          <Input
            type="url"
            value={formData.youtubeLink}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                youtubeLink: e.target.value,
              }))
            }
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>

        {/* Category */}
        <div>
          <Label>Category *</Label>
          <select
            className="border rounded-md p-2 w-full"
            value={formData.subjectId}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, subjectId: e.target.value }))
            }
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* PDF Upload */}
        <div>
          <Label>PDF Notes</Label>
          <Card>
            <CardContent className="p-4">
              {formData.pdfUrl ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    <span className="text-sm">PDF uploaded</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={removePdf}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <Label htmlFor="pdf-upload" className="cursor-pointer">
                      Upload PDF
                    </Label>
                    <Input
                      id="pdf-upload"
                      type="file"
                      accept="application/pdf"
                      onChange={(e) =>
                        e.target.files?.[0] && handlePdfUpload(e.target.files[0])
                      }
                      className="hidden"
                    />
                  </div>
                  {uploading && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tiptap Editor */}
        <div>
          <Label>Content</Label>
          <Card>
            <CardContent className="p-0">
              {editor && (
                <div className="border-b flex flex-wrap items-center gap-1 p-2">
                  <Button
                    type="button"
                    variant={editor.isActive("bold") ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className="h-8 w-8 p-0"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={editor.isActive("italic") ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className="h-8 w-8 p-0"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={editor.isActive("underline") ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() =>
                      editor.chain().focus().toggleUnderline().run()
                    }
                    className="h-8 w-8 p-0"
                  >
                    <UnderlineIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={
                      editor.isActive("bulletList") ? "secondary" : "ghost"
                    }
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={
                      editor.isActive("orderedList") ? "secondary" : "ghost"
                    }
                    size="sm"
                    onClick={() =>
                      editor.chain().focus().toggleOrderedList().run()
                    }
                    className="h-8 w-8 p-0"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="p-3 min-h-[150px] max-h-[300px] overflow-y-auto">
                <EditorContent editor={editor} />
                {editor && !editor.getText() && (
                  <p className="text-muted-foreground text-sm">
                    Write your material content...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || !formData.title.trim()}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {materialId ? "Update Material" : "Create Material"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
