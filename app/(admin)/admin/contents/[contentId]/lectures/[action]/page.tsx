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
import MenuBar from "@/components/rich-text-editor/menu-bar";
import { 
  FileText, 
  Video, 
  Loader2, 
  Save,
  X,
  ArrowLeft,
  Upload,
  FileUp,
  VideoIcon,

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
  const [youtubeEmbedUrl, setYoutubeEmbedUrl] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [order, setOrder] = useState<number | null>(null);
  const [maxOrder, setMaxOrder] = useState<number>(0);
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
// PDF related states
const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
const [showPdfPreview, setShowPdfPreview] = useState(false);



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
    const fetchData = async () => {
      try {
        // Fetch all lectures for this content to get max order
        const lecturesRes = await fetch(`/api/admin/contents/${contentId}/lectures`);
        if (lecturesRes.ok) {
          const lecturesData = await lecturesRes.json();
          const max = lecturesData.length > 0 
            ? Math.max(...lecturesData.map((l: { order: number }) => l.order))
            : 0;
          setMaxOrder(max);
        }

        if (action === "edit" && lectureId) {
          const res = await fetch(`/api/admin/lectures/${lectureId}`);
          if (!res.ok) throw new Error("Failed to load lecture");
          const data = await res.json();
          
          setTitle(data.title);
          setVideoUrl(data.videoUrl || "");
          setYoutubeEmbedUrl(data.youtubeEmbedUrl || "");
          setPdfUrl(data.pdfUrl || "");
          setOrder(data.order);
          if (editor && data.summary) {
            editor.commands.setContent(data.summary);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load lecture");
      } finally {
        setLoading(false);
      }
    };

    if (action === "add" || (action === "edit" && lectureId)) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [action, lectureId, editor, contentId]);


 const handleUpload = async (file: File, type: "video" | "pdf") => {
  try {
    setUploading(prev => ({ ...prev, [type]: true }));
    setUploadProgress(prev => ({ ...prev, [type]: 0 }));

    // ── Step 1: Get a signed upload signature from our API ──────────────────
    // This is a tiny JSON request — well within Vercel's limits.
    const sigRes = await fetch("/api/cloudinary-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, fileType: file.type }),
    });

    if (!sigRes.ok) {
      const sigErr = await sigRes.json().catch(() => ({}));
      throw new Error(sigErr?.error || "Failed to get upload signature");
    }

    const { signature, timestamp, publicId, resourceType, apiKey, cloudName } =
      await sigRes.json();

    // ── Step 2: Upload directly from the browser to Cloudinary ─────────────
    // Cloudinary accepts up to 100 MB per upload — no Vercel limit applies.
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    // IMPORTANT: Only append params that were included in the signature.
    // Cloudinary re-signs ALL received params server-side — any extra param
    // not in the original signature will cause an "Invalid Signature" error.
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("signature", signature);
    formData.append("timestamp", String(timestamp));
    formData.append("public_id", publicId);
    if (resourceType === "raw") {
      formData.append("format", "pdf");
    }

    const xhr = new XMLHttpRequest();

    // Track real upload progress (browser → Cloudinary)
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(prev => ({ ...prev, [type]: progress }));
      }
    });

    const uploadPromise = new Promise<any>((resolve, reject) => {
      xhr.addEventListener("load", () => {
        let data: any;
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          reject(new Error(`Upload failed (HTTP ${xhr.status})`));
          return;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(new Error(data?.error?.message || data?.error || "Cloudinary upload failed"));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("Network error — upload failed")));
      xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));
    });

    xhr.open("POST", uploadUrl);
    xhr.send(formData);

    const data = await uploadPromise;

    let fileUrl: string = data.secure_url;

    // Ensure PDFs use the /raw/ URL path
    if (resourceType === "raw" && fileUrl.includes("/image/upload/")) {
      fileUrl = fileUrl.replace("/image/upload/", "/raw/upload/");
    }

    if (type === "video") setVideoUrl(fileUrl);
    if (type === "pdf") setPdfUrl(fileUrl);

    toast.success(`${type.toUpperCase()} uploaded successfully`);
  } catch (err: unknown) {
    console.error("Upload error:", err);
    const errorMessage = err instanceof Error ? err.message : `Failed to upload ${type}`;
    toast.error(errorMessage);
  } finally {
    setUploading(prev => ({ ...prev, [type]: false }));
  }
};

// ---------------- PDF Preview ----------------
const handlePreviewPdf = () => {
  if (pdfUrl) {
    setPdfPreviewUrl(pdfUrl);
    setShowPdfPreview(true);
  }
};

console.log("PDF Preview URL:", pdfPreviewUrl);




  const removeFile = (type: "video" | "pdf") => {
    if (type === "video") {
      setVideoUrl("");
      // Don't clear YouTube URL when removing video file, they're separate options
    }
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
        youtubeEmbedUrl,
        pdfUrl,
        summary: editor?.getHTML() || "",
        order: order ?? undefined // Only send order if explicitly set
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
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to save lecture";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
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
            <CardTitle className="text-lg text-blue-500 flex items-center gap-2">
              {/* <Type className="h-5 w-5 text-primary" /> */}
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

        {/* Order/Position */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-amber-500 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
              </svg>
              Display Order
            </CardTitle>
            <CardDescription>
              Set the position of this lecture in the content module
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="order" className="text-sm font-medium mb-2 block">
                  Position {order !== null && `(${order})`}
                </Label>
                <Input
                  id="order"
                  type="number"
                  min="1"
                  max={action === "edit" ? maxOrder : maxOrder + 1}
                  value={order ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setOrder(val === "" ? null : Number.parseInt(val, 10));
                  }}
                  placeholder={`Leave empty for last position (${maxOrder + 1})`}
                  className="border-border/50 focus-visible:ring-primary"
                />
              </div>
              {order !== null && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOrder(null)}
                  className="mt-7"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">How ordering works:</p>
                  <ul className="space-y-1 list-disc list-inside ml-2">
                    <li><strong>Leave empty:</strong> Lecture will be added at the end (position {maxOrder + 1})</li>
                    <li><strong>Set a position:</strong> Other lectures will automatically shift to make room</li>
                    <li><strong>No conflicts:</strong> You cannot occupy an existing lecture&apos;s position - they will move</li>
                  </ul>
                </div>
              </div>
            </div>
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
              Upload a video file or provide a YouTube embed link for this lecture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* YouTube Embed URL Input */}
            <div className="space-y-3">
              <Label htmlFor="youtube-url" className="text-sm font-medium flex items-center gap-2">
                <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YouTube Embed URL (Optional)
              </Label>
              <Input
                id="youtube-url"
                type="url"
                value={youtubeEmbedUrl}
                onChange={(e) => setYoutubeEmbedUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Paste a YouTube URL here. Supports watch URLs, share URLs, and embed URLs.
              </p>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/30" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">OR</span>
              </div>
            </div>

            {/* Video File Upload */}
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
  onClick={handlePreviewPdf}
  disabled={!pdfUrl}
>
  Preview PDF
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
        {/* Replace your custom toolbar with the MenuBar component */}
        <MenuBar editor={editor} />
        
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
<Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
  <DialogContent className="max-w-5xl w-full h-[85vh] p-0 overflow-hidden rounded-lg">
    {/* Add DialogTitle for accessibility (visually hidden) */}
    <DialogTitle className="sr-only">PDF Preview</DialogTitle>
    
    {/* Simple header with close button */}
   

    <div className="h-full bg-gray-100 flex items-center justify-center">
      {pdfPreviewUrl ? (
        <div className="w-full h-full">
          <iframe
            src={pdfPreviewUrl}
            className="w-full h-full border-0"
            title="PDF Preview"
            onError={(e) => {
              console.error("PDF failed to load", e);
            }}
          />
        </div>
      ) : (
        <div className="text-center space-y-4 p-8 bg-white rounded-lg border border-gray-200 max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">No PDF available</h3>
            <p className="text-sm text-gray-500">There&apos;s no PDF document available for preview at this time.</p>
          </div>
          <Button
            onClick={() => setShowPdfPreview(false)}
            className="bg-gray-800 hover:bg-gray-900 text-white"
          >
            Close Preview
          </Button>
        </div>
      )}
    </div>
  </DialogContent>
</Dialog>
    </div>
  );
}