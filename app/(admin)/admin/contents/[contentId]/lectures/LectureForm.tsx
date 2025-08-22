// app/(admin)/admin/contents/[contentId]/lectures/LectureForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  FileText, 
  Video, 
  Loader2, 
  Save,
  X
} from "lucide-react";

// Text editor imports
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
} from "lucide-react";

interface LectureFormProps {
  contentId: string;
  lecture?: any;
  onSuccess: () => void;
}

export default function LectureForm({ contentId, lecture, onSuccess }: LectureFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(lecture?.title || "");
  const [videoUrl, setVideoUrl] = useState(lecture?.videoUrl || "");
  const [pdfUrl, setPdfUrl] = useState(lecture?.pdfUrl || "");
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{video: number, pdf: number}>({
    video: 0,
    pdf: 0
  });
  const [uploading, setUploading] = useState<{video: boolean, pdf: boolean}>({
    video: false,
    pdf: false
  });

  // Text editor setup
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: lecture?.summary || "",
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[150px] p-3',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && lecture?.summary) {
      editor.commands.setContent(lecture.summary);
    }
  }, [editor, lecture]);

  const handleUpload = async (file: File, type: "video" | "pdf") => {
    try {
      setUploading(prev => ({ ...prev, [type]: true }));
      setUploadProgress(prev => ({ ...prev, [type]: 0 }));

      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({ ...prev, [type]: progress }));
        }
      });

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } else {
            reject(new Error("Upload failed"));
          }
        });
        
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));
      });

      xhr.open("POST", "/api/upload");
      xhr.send(formData);

      const data: any = await uploadPromise;
      
      if (type === "video") setVideoUrl(data.url);
      if (type === "pdf") setPdfUrl(data.url);

      toast.success(`${type.toUpperCase()} uploaded successfully`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const removeFile = (type: "video" | "pdf") => {
    if (type === "video") setVideoUrl("");
    if (type === "pdf") setPdfUrl("");
    toast.info(`${type.toUpperCase()} removed`);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title for the lecture");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: title.trim(),
        videoUrl,
        pdfUrl,
        summary: editor?.getHTML() || "",
        order: lecture?.order || 0
      };

      const url = lecture
        ? `/api/admin/lectures/${lecture.id}`
        : `/api/admin/contents/${contentId}/lectures`;

      const method = lecture ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Save failed");
      }

      toast.success(`Lecture ${lecture ? "updated" : "created"} successfully`);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save lecture");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title" className="mb-2 block">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter lecture title"
          className="text-lg"
        />
      </div>

      {/* Video upload */}
      <div>
        <Label className="mb-2 block">Video</Label>
        <Card>
          <CardContent className="p-4">
            {videoUrl ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Video className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">Video uploaded</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile("video")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Video className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor="video-upload" className="cursor-pointer">
                    Upload video
                  </Label>
                  <Input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={(e) =>
                      e.target.files?.[0] && handleUpload(e.target.files[0], "video")
                    }
                    className="hidden"
                  />
                </div>
                {uploading.video && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress.video} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Uploading... {uploadProgress.video}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PDF upload */}
      <div>
        <Label className="mb-2 block">PDF Notes</Label>
        <Card>
          <CardContent className="p-4">
            {pdfUrl ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  <span className="text-sm">PDF uploaded</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile("pdf")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor="pdf-upload" className="cursor-pointer">
                    Upload PDF
                  </Label>
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                      e.target.files?.[0] && handleUpload(e.target.files[0], "pdf")
                    }
                    className="hidden"
                  />
                </div>
                {uploading.pdf && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress.pdf} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Uploading... {uploadProgress.pdf}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary (Tiptap Editor) */}
      <div>
        <Label className="mb-2 block">Summary</Label>
        <Card>
          <CardContent className="p-0">
            {editor && (
              <div className="border-b">
                <div className="flex flex-wrap items-center gap-1 p-2">
                  <Button
                    type="button"
                    variant={editor.isActive('bold') ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className="h-8 w-8 p-0"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={editor.isActive('italic') ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className="h-8 w-8 p-0"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={editor.isActive('underline') ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className="h-8 w-8 p-0"
                  >
                    <UnderlineIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={editor.isActive('bulletList') ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={editor.isActive('orderedList') ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className="h-8 w-8 p-0"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <div className="p-3 min-h-[150px] max-h-[300px] overflow-y-auto">
              <EditorContent editor={editor} />
              {editor && !editor.getText() && (
                <p className="text-muted-foreground text-sm">
                  Write a summary of this lecture...
                </p>
              )}
            </div>
            </CardContent>
          </Card>
        </div>

        {/* Save button */}
        <Button 
          onClick={handleSubmit} 
          disabled={saving || !title.trim()}
          className="w-full"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {lecture ? "Update Lecture" : "Create Lecture"}
            </>
          )}
        </Button>
      </div>

  );
}