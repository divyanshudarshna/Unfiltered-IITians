"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, X, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

export default function StoryFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyId = searchParams.get("id");

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    content: "",
    image: "",
    rating: 5,
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Tiptap Editor setup
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: formData.content || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base focus:outline-none min-h-[150px] p-3",
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setFormData((prev) => ({ ...prev, content: editor.getHTML() }));
    },
  });

  useEffect(() => {
    const fetchStory = async () => {
      if (!storyId) {
        setInitializing(false);
        return;
      }
      try {
        const res = await fetch(`/api/admin/success-stories/${storyId}`);
        if (res.ok) {
          const story = await res.json();
          setFormData(story);
          editor?.commands.setContent(story.content || "");
        }
      } catch {
        toast.error("Failed to load story");
      } finally {
        setInitializing(false);
      }
    };
    fetchStory();
  }, [storyId, editor]);

  // Image Upload
  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      });

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.addEventListener("load", () => (xhr.status >= 200 && xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error("Upload failed"))));
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
      });

      xhr.open("POST", "/api/upload");
      xhr.send(formData);

      const data = await uploadPromise;
      setFormData((prev) => ({ ...prev, image: data.url }));
      toast.success("Image uploaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }));
    toast.info("Image removed");
  };

  // Submit
  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.role.trim()) {
      toast.error("Name and Role are required");
      return;
    }

    try {
      setLoading(true);
      const url = storyId ? `/api/admin/success-stories/${storyId}` : "/api/admin/success-stories";
      const method = storyId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast.success(`Story ${storyId ? "updated" : "created"} successfully`);
      router.push("/admin/successStories");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) return <p>Loading...</p>;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold">{storyId ? "Edit Story" : "Add New Story"}</h1>

      {/* Name & Role */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Name *</Label>
          <Input value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} />
        </div>
        <div>
          <Label>Role *</Label>
          <Input value={formData.role} onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))} />
        </div>
      </div>

      {/* Rating */}
      <div>
        <Label>Rating</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
              className={`text-3xl transition-colors ${formData.rating >= star ? "text-yellow-400" : "text-gray-300"} hover:text-yellow-500`}
            >
              ★
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">{formData.rating}</span>
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <Label>Image</Label>
        <Card>
          <CardContent className="p-4 flex flex-col items-start gap-3">
            {formData.image ? (
              <div className="flex items-center justify-between w-full">
                <img src={formData.image} alt="Story Image" className="h-24 w-24 object-cover rounded" />
                <Button variant="ghost" size="sm" onClick={removeImage}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer text-blue-500">
                <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} className="hidden" />
                {uploadingImage ? `Uploading... ${uploadProgress}%` : "Click to Upload Image"}
              </label>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Editor */}
      <div>
        <Label>Content</Label>
        <Card>
          {editor && (
            <div className="border-b p-2 flex flex-wrap gap-1 bg-slate-800">
              <Button variant={editor.isActive("bold") ? "secondary" : "ghost"} size="sm" onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Button>
              <Button variant={editor.isActive("italic") ? "secondary" : "ghost"} size="sm" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Button>
              <Button variant={editor.isActive("underline") ? "secondary" : "ghost"} size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></Button>
              <Button variant={editor.isActive("bulletList") ? "secondary" : "ghost"} size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Button>
              <Button variant={editor.isActive("orderedList") ? "secondary" : "ghost"} size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Button>
            </div>
          )}
          <CardContent className="p-0 min-h-[200px] max-h-[400px] overflow-y-auto">
            <EditorContent editor={editor} />
            {editor && !editor.getText() && <p className="text-muted-foreground text-sm p-3">Write story content here...</p>}
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" /> Save Story
          </>
        )}
      </Button>
    </div>
  );
}
