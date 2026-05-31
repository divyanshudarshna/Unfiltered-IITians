"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Star } from "lucide-react";

type ApprovalStatus = "pending" | "approved" | "rejected" | string;

interface StoryFormData {
  name: string;
  role: string;
  image: string;
  rating: number;
  content: string;
}

interface ExistingStoryResponse {
  id: string;
  name: string;
  role: string;
  image: string | null;
  rating: number;
  content: string;
  approvalStatus: ApprovalStatus;
  approvalNotes: string | null;
}

const emptyForm: StoryFormData = {
  name: "",
  role: "",
  image: "",
  rating: 5,
  content: "",
};

export default function SuccessStoryFormPage() {
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const isEditMode = searchParams.get("edit") === "1";

  const [form, setForm] = useState<StoryFormData>(emptyForm);
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ApprovalStatus>("pending");
  const [approvalNotes, setApprovalNotes] = useState<string | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [lastSubmissionWasEdit, setLastSubmissionWasEdit] = useState(false);

  const dashboardPath = user?.firstName
    ? `/${encodeURIComponent(user.firstName)}/dashboard`
    : "/";

  useEffect(() => {
    if (!isEditMode) {
      setLoadingExisting(false);
      return;
    }

    if (!isLoaded) return;
    if (!user) {
      setLoadingExisting(false);
      return;
    }

    async function fetchExistingStory() {
      setLoadingExisting(true);
      try {
        const res = await fetch("/api/success-story-application", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load your success story.");
        }

        const story = data.story as ExistingStoryResponse | null;
        if (!story) {
          toast.error("No existing success story found for your account.");
          setLoadingExisting(false);
          return;
        }

        setStoryId(story.id);
        setCurrentStatus(story.approvalStatus || "pending");
        setApprovalNotes(story.approvalNotes || null);
        setForm({
          name: story.name || "",
          role: story.role || "",
          image: story.image || "",
          rating: story.rating || 5,
          content: story.content || "",
        });
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to load success story.");
      } finally {
        setLoadingExisting(false);
      }
    }

    fetchExistingStory();
  }, [isEditMode, isLoaded, user]);

  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!form.role.trim()) {
      toast.error("Role/Achievement is required");
      return false;
    }
    if (!form.image.trim()) {
      toast.error("Profile photo is required");
      return false;
    }
    if (!form.content.trim()) {
      toast.error("Success message is required");
      return false;
    }
    if (form.rating < 1 || form.rating > 5) {
      toast.error("Rating must be between 1 and 5");
      return false;
    }
    return true;
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setForm((prev) => ({ ...prev, image: data.url }));
      toast.success("Photo uploaded successfully");
    } catch {
      toast.error("Failed to upload image. Try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const submitStory = async () => {
    setSaving(true);
    try {
      if (isEditMode && !storyId) {
        throw new Error("No existing success story found for this account.");
      }

      const res = await fetch("/api/success-story-application", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, storyId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit success story");
      }

      if (isEditMode) {
        setCurrentStatus("pending");
        setApprovalNotes(null);
        setLastSubmissionWasEdit(true);
        toast.success("Story updated and sent for admin approval.", {
          description: "Status is now pending until admin approves your latest changes.",
          duration: 7000,
        });
      } else {
        toast.success("Success story submitted!", {
          description: "Your story has been sent to admin for approval.",
          duration: 6000,
        });
      }

      setSubmitted(true);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Submission failed. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isEditMode) {
      setSubmitDialogOpen(true);
      return;
    }

    await submitStory();
  };

  if (loadingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-3xl border bg-white dark:bg-[#0e0c1a] p-8 text-center shadow-xl">
          <Loader2 className="h-7 w-7 animate-spin mx-auto text-violet-500 mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Loading your success story details...
          </p>
        </div>
      </div>
    );
  }

  if (isEditMode && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-3xl border bg-white dark:bg-[#0e0c1a] p-8 text-center shadow-xl space-y-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Sign in required</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Please sign in to edit your success story.
          </p>
          <Button onClick={() => (window.location.href = "/sign-in")}>Go to Sign In</Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white dark:bg-[#0e0c1a] border rounded-3xl shadow-2xl p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full border border-green-200 dark:border-green-800/50 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {lastSubmissionWasEdit ? "Story Updated!" : "Story Submitted!"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {lastSubmissionWasEdit
                ? "Your latest update has been sent to admin. It will show on the public success-stories page only after approval."
                : "Thank you for sharing your journey. Your story is sent to admin and will be visible publicly after approval."}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              (window.location.href = lastSubmissionWasEdit ? dashboardPath : "/success-stories")
            }
          >
            {lastSubmissionWasEdit ? "Back to Dashboard" : "Go to Success Stories"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50/70 to-slate-50 dark:from-[#050408] dark:via-[#0b0714] dark:to-[#060a10]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {isEditMode ? "Edit Your Success Story" : "Share Your Success Story"}
          </h1>
          <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
            Your story will be reviewed by admin before appearing on the public page.
          </p>
        </div>

        {isEditMode && (
          <div className="mb-5 rounded-2xl border border-violet-200/70 dark:border-violet-700/30 bg-white/90 dark:bg-[#0e0c1a]/90 p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Current status: <span className="capitalize">{currentStatus}</span>
            </p>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Saving edits will reset status to pending and send your latest story for admin approval.
            </p>
            {approvalNotes && (
              <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">
                <strong>Admin note:</strong> {approvalNotes}
              </p>
            )}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#0e0c1a] rounded-3xl shadow-2xl border border-violet-100 dark:border-[#1e1a2e] overflow-hidden"
        >
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role / Achievement *</Label>
                <Input
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g. AIR 51 (IIT JAM 2026)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Profile Photo *</Label>
              <div className="flex items-center gap-5 p-4 bg-gray-50 dark:bg-[#12101e] border border-dashed border-gray-200 dark:border-[#2a2440] rounded-xl">
                <div className="relative h-20 w-20 rounded-full border-2 border-violet-200 dark:border-violet-800/50 overflow-hidden flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 flex-shrink-0">
                  {form.image ? (
                    <Image
                      src={form.image}
                      alt="Profile preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500 px-2 text-center">
                      No photo
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleImageUpload(file);
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    JPG, PNG, WEBP up to 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rating *</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, rating: star }))}
                    className="p-1"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        form.rating >= star
                          ? "fill-yellow-400 text-yellow-500"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">{form.rating}/5</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Share Your Message *</Label>
              <Textarea
                rows={7}
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Tell us about your journey, preparation strategy, and key lessons."
              />
            </div>
          </div>

          <div className="p-6 md:p-8 border-t bg-gray-50/70 dark:bg-[#0a0817]">
            <Button type="submit" className="w-full" disabled={saving || uploadingImage}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? "Saving Changes..." : "Submitting..."}
                </>
              ) : uploadingImage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading photo...
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Submit Success Story"
              )}
            </Button>
          </div>
        </form>

        <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resubmit updated story for approval?</AlertDialogTitle>
              <AlertDialogDescription>
                Saving these edits will reset story status to pending until admin reviews the
                updated version.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={saving}
                onClick={(event) => {
                  event.preventDefault();
                  setSubmitDialogOpen(false);
                  void submitStory();
                }}
              >
                {saving ? "Saving..." : "Yes, submit for approval"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
