// app/(admin)/admin/contents/[contentId]/lectures/[action]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  FileText, 
  Video, 
  Loader2, 
  Save,
  X,
  ArrowLeft,
  Eye,
  Upload,
  FileUp,
  VideoIcon,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  ImageIcon,
  LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered
} from "lucide-react";
import Link from "next/link";

// Text editor imports
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";
import Blockquote from "@tiptap/extension-blockquote";
import LinkExtension from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";

// PDF Preview Modal
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LectureFormPageProps {
  params: Promise<{ 
    contentId: string; 
    action: string;
  }>;
}

interface UploadProgress {
  video: number;
  pdf: number;
}

interface UploadingState {
  video: boolean;
  pdf: boolean;
}

export default function LectureFormPage({ params }: LectureFormPageProps) {
  const { contentId, action } = React.use(params);
  const searchParams = useSearchParams();
  const lectureId = searchParams.get("lectureId");
  const router = useRouter();
  
  const [title, setTitle] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(action === "edit");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    video: 0,
    pdf: 0
  });
  const [uploading, setUploading] = useState<UploadingState>({
    video: false,
    pdf: false
  });
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false);

  // Text editor setup
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Blockquote,
      LinkExtension.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none min-h-[250px] p-4 max-w-none',
      },
    },
    immediatelyRender: false,
  });

  // Fetch lecture data if editing
  useEffect(() => {
    if (action === "edit" && lectureId) {
      const fetchLecture = async () => {
        try {
          const res = await fetch(`/api/admin/lectures/${lectureId}`);
          if (!res.ok) throw new Error("Failed to load lecture");
          const data = await res.json();
          
          setTitle(data.title);
          setVideoUrl(data.videoUrl || "");
          setPdfUrl(data.pdfUrl || "");
          if (editor && data.summary) {
            editor.commands.setContent(data.summary);
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to load lecture");
        } finally {
          setLoading(false);
        }
      };

      fetchLecture();
    } else if (action === "add") {
      setLoading(false);
    }
  }, [action, lectureId, editor]);

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
        order: 0
      };

      const url = action === "edit" && lectureId
        ? `/api/admin/lectures/${lectureId}`
        : `/api/admin/contents/${contentId}/lectures`;

      const method = action === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Save failed");
      }

      toast.success(`Lecture ${action === "edit" ? "updated" : "created"} successfully`);
      router.push(`/admin/contents/${contentId}/lectures`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save lecture");
    } finally {
      setSaving(false);
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/contents/${contentId}/lectures`}>
          <Button variant="outline" size="icon" className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {action === "edit" ? "Edit Lecture" : "Add New Lecture"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {action === "edit" ? "Update the lecture details" : "Create a new lecture for this course content"}
          </p>
          {action === "edit" && lectureId && (
            <p className="text-sm text-muted-foreground">
              Editing Lecture ID: {lectureId}
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-8">
        {/* Title */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Type className="h-5 w-5 text-primary" />
              Lecture Title
            </CardTitle>
            <CardDescription>
              Enter a descriptive title for your lecture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter lecture title"
              className="text-lg border-border/50 focus-visible:ring-primary"
            />
          </CardContent>
        </Card>

        {/* Video upload */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <VideoIcon className="h-5 w-5 text-blue-500" />
              Video Content
            </CardTitle>
            <CardDescription>
              Upload a video file for this lecture
            </CardDescription>
          </CardHeader>
          <CardContent>
            {videoUrl ? (
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center space-x-3">
                  <Video className="h-6 w-6 text-blue-500" />
                  <div>
                    <p className="font-medium">Video uploaded</p>
                    <p className="text-sm text-muted-foreground truncate max-w-xs">
                      {videoUrl.split('/').pop()?.split('?')[0] || 'video.mp4'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile("video")}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Label 
                  htmlFor="video-upload" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/50 rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload video</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      MP4, MOV, AVI (MAX. 500MB)
                    </p>
                  </div>
                  <Input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={(e) =>
                      e.target.files?.[0] && handleUpload(e.target.files[0], "video")
                    }
                    className="hidden"
                  />
                </Label>
                {uploading.video && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading video...</span>
                      <span>{uploadProgress.video}%</span>
                    </div>
                    <Progress value={uploadProgress.video} className="h-2 bg-muted" />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PDF upload */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileUp className="h-5 w-5 text-green-500" />
              PDF Notes
            </CardTitle>
            <CardDescription>
              Upload PDF notes or supplementary materials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pdfUrl ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="font-medium">PDF uploaded</p>
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {pdfUrl.split('/').pop()?.split('?')[0] || 'document.pdf'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPdfPreview(true)}
                      className="h-8 gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile("pdf")}
                      className="h-8 w-8 p-0 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Label 
                  htmlFor="pdf-upload" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/50 rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload PDF</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF (MAX. 20MB)
                    </p>
                  </div>
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                      e.target.files?.[0] && handleUpload(e.target.files[0], "pdf")
                    }
                    className="hidden"
                  />
                </Label>
                {uploading.pdf && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading PDF...</span>
                      <span>{uploadProgress.pdf}%</span>
                    </div>
                    <Progress value={uploadProgress.pdf} className="h-2 bg-muted" />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary (Tiptap Editor) */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              Lecture Summary
            </CardTitle>
            <CardDescription>
              Add a detailed summary of the lecture content
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {editor && (
              <div className="border-b border-border/30">
                <div className="flex flex-wrap items-center gap-1 p-3">
                  {/* Headings */}
                  <Button
                    type="button"
                    variant={editor.isActive('heading', { level: 1 }) ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className="h-8 w-8 p-0"
                    title="Heading 1"
                  >
                    <Heading1 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={editor.isActive('heading', { level: 2 }) ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className="h-8 w-8 p-0"
                    title="Heading 2"
                  >
                    <Heading2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={editor.isActive('heading', { level: 3 }) ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className="h-8 w-8 p-0"
                    title="Heading 3"
                  >
                    <Heading3 className="h-4 w-4" />
                  </Button>
                  
                  <div className="h-5 w-px bg-border/50 mx-1"></div>
                  
                  {/* Text formatting */}
                  <Button
                    type="button"
                    variant={editor.isActive('bold') ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className="h-8 w-8 p-0"
                    title="Bold"
                  >
                    <Type className="h-4 w-4" weight="bold" />
                  </Button>
                  <Button
                    type="button"
                    variant={editor.isActive('italic') ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className="h-8 w-8 p-0"
                    title="Italic"
                  >
                    <Type className="h-4 w-4" style={{ fontStyle: 'italic' }} />
                  </Button>
                  <Button
                    type="button"
                    variant={editor.isActive('underline') ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className="h-8 w-8 p-0"
                    title="Underline"
                  >
                    <Type className="h-4 w-4" style={{ textDecoration: 'underline' }} />
                  </Button>
                  
                  <div className="h-5 w-px bg-border/50 mx-1"></div>
                  
                  {/* Alignment */}
                  <Button
                    type="button"
                    variant={editor.isActive({ textAlign: 'left' }) ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className="h-8 w-8 p-0"
                    title="Align Left"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={editor.isActive({ textAlign: 'center' }) ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className="h-8 w-8 p-0"
                    title="Align Center"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={editor.isActive({ textAlign: 'right' }) ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className="h-8 w-8 p-0"
                    title="Align Right"
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                  
                  <div className="h-5 w-px bg-border/50 mx-1"></div>
                  
                  {/* Lists */}
                  <Button
                    type="button"
                    variant={editor.isActive('bulletList') ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className="h-8 w-8 p-0"
                    title="Bullet List"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={editor.isActive('orderedList') ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className="h-8 w-8 p-0"
                    title="Numbered List"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={editor.isActive('blockquote') ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className="h-8 w-8 p-0"
                    title="Blockquote"
                  >
                    <Quote className="h-4 w-4" />
                  </Button>
                  
                  <div className="h-5 w-px bg-border/50 mx-1"></div>
                  
                  {/* Links & Images */}
                  <Button
                    type="button"
                    variant={editor.isActive('link') ? "secondary" : "ghost"}
                    size="sm"
                    onClick={setLink}
                    className="h-8 w-8 p-0"
                    title="Add Link"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addImage}
                    className="h-8 w-8 p-0"
                    title="Add Image"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  
                  <div className="h-5 w-px bg-border/50 mx-1"></div>
                  
                  {/* Undo/Redo */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="h-8 w-8 p-0"
                    title="Undo"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="h-8 w-8 p-0"
                    title="Redo"
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <div className="p-4 min-h-[250px] max-h-[500px] overflow-y-auto">
              <EditorContent editor={editor} />
              {editor && !editor.getText() && (
                <p className="text-muted-foreground text-sm mt-2">
                  Write a summary of this lecture... You can use headings, lists, quotes, and more.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <Button 
          onClick={handleSubmit} 
          disabled={saving || !title.trim()}
          className="w-full py-6 text-lg font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              {action === "edit" ? "Update Lecture" : "Create Lecture"}
            </>
          )}
        </Button>
      </div>

      {/* PDF Preview Modal */}
      <Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>PDF Preview</DialogTitle>
          </DialogHeader>
          <div className="h-full w-full flex items-center justify-center">
            {pdfUrl ? (
              <iframe 
                src={`https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`} 
                className="w-full h-full rounded-md border border-border"
                frameBorder="0"
                onError={(e) => {
                  console.error("Failed to load PDF");
                  // Fallback to direct URL if Google viewer fails
                  (e.target as HTMLIFrameElement).src = pdfUrl;
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileText className="h-12 w-12 mb-4" />
                <p>No PDF available for preview</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}