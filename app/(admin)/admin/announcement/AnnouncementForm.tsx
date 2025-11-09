"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, X } from "lucide-react";
import {toast} from "sonner";

interface Course {
  id: string;
  title: string;
}

interface Announcement {
  id?: string;
  title?: string;
  message?: string;
  courseId?: string;
  sendEmail?: boolean;
}

interface AnnouncementFormProps {
  open: boolean;
  courses: Course[];
  announcement?: Announcement | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AnnouncementForm({ open, courses, announcement, onSuccess, onCancel }: AnnouncementFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: announcement?.title || "",
    message: announcement?.message || "",
    courseId: announcement?.courseId || "",
    sendEmail: announcement?.sendEmail || false,
  });

  // Update form values when the announcement prop changes (e.g. when editing an announcement)
  useEffect(() => {
    setFormData({
      title: announcement?.title || "",
      message: announcement?.message || "",
      courseId: announcement?.courseId || "",
      sendEmail: announcement?.sendEmail || false,
    });
  }, [announcement, open]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = announcement?.id 
        ? `/api/admin/course-announcement?id=${announcement.id}`
        : "/api/admin/course-announcement";
      
      const method = announcement?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Operation failed");
      }
    } catch (err: any) {
      toast.error("Failed to save announcement:",err)
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span className="text-lg sm:text-xl">
              {announcement?.id ? "Edit Announcement" : "Create New Announcement"}
            </span>
            <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 absolute right-4 top-4">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="course">Course *</Label>
            <Select
              value={formData.courseId}
              onValueChange={(value) => handleChange("courseId", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter announcement title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleChange("message", e.target.value)}
              placeholder="Enter announcement message"
              rows={6}
              required
              className="resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3">
            <div className="space-y-0.5">
              <Label htmlFor="sendEmail" className="text-sm sm:text-base">
                Send as email notification
              </Label>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Send this announcement as an email to all enrolled students
              </p>
            </div>
            <Switch
              id="sendEmail"
              checked={formData.sendEmail}
              onCheckedChange={(checked) => handleChange("sendEmail", checked)}
              className="self-end sm:self-auto"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <span className="truncate">
                {announcement?.id ? "Update Announcement" : "Create Announcement"}
              </span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}