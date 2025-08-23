"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  BookOpen, 
  DollarSign, 
  Calendar, 
  FileText, 
  Tag,
  Save,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CourseFormProps {
  onSuccess: () => void;
  course?: any; // optional for editing
}

enum PublishStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export default function CourseForm({ onSuccess, course }: CourseFormProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    actualPrice: "",
    durationMonths: "",
    status: PublishStatus.DRAFT,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title || "",
        description: course.description || "",
        price: course.price?.toString() || "",
        actualPrice: course.actualPrice?.toString() || "",
        durationMonths: course.durationMonths?.toString() || "",
        status: course.status || PublishStatus.DRAFT,
      });
    }
  }, [course]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStatusChange = (value: string) => {
    setForm({ ...form, status: value as PublishStatus });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = course ? "PUT" : "POST";
      const url = course ? `/api/admin/courses/${course.id}` : "/api/admin/courses";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price: Number(form.price),
          actualPrice: Number(form.actualPrice),
          durationMonths: Number(form.durationMonths),
          status: form.status,
        }),
      });

      if (!res.ok) throw new Error("Failed to save course");

      toast.success(course ? "Course updated successfully!" : "Course created successfully!");
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Error saving course");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: PublishStatus) => {
    switch (status) {
      case PublishStatus.PUBLISHED:
        return "text-green-600 bg-green-100";
      case PublishStatus.DRAFT:
        return "text-yellow-600 bg-yellow-100";
      case PublishStatus.ARCHIVED:
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: PublishStatus) => {
    switch (status) {
      case PublishStatus.PUBLISHED:
        return "Published";
      case PublishStatus.DRAFT:
        return "Draft";
      case PublishStatus.ARCHIVED:
        return "Archived";
      default:
        return status;
    }
  };

  return (
    <div className="max-h-[90vh] overflow-y-auto">
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {course ? "Edit Course" : "Create New Course"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Course Details
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-1">
                    <span>Course Title</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="title"
                    name="title" 
                    value={form.title} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter course title"
                    className="focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-1">
                    <span>Description</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea 
                    id="description"
                    name="description" 
                    value={form.description} 
                    onChange={handleChange} 
                    required 
                    placeholder="Describe what students will learn in this course"
                    rows={4}
                    className="focus-visible:ring-primary resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="flex items-center gap-1">
                    <span>Regular Price ($)</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="price"
                    type="number" 
                    name="price" 
                    value={form.price} 
                    onChange={handleChange} 
                    required 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualPrice" className="flex items-center gap-1">
                    <span>Discounted Price ($)</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="actualPrice"
                    type="number" 
                    name="actualPrice" 
                    value={form.actualPrice} 
                    onChange={handleChange} 
                    required 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="focus-visible:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Duration & Status Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Duration & Status
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationMonths" className="flex items-center gap-1">
                    <span>Duration (months)</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="durationMonths"
                    type="number" 
                    name="durationMonths" 
                    value={form.durationMonths} 
                    onChange={handleChange} 
                    required 
                    min="1"
                    placeholder="3"
                    className="focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    <span>Status</span>
                  </Label>
                  <Select 
                    value={form.status} 
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="focus:ring-primary">
                      <SelectValue>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(form.status as PublishStatus)}`}>
                          {getStatusText(form.status as PublishStatus)}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PublishStatus.DRAFT}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span>Draft</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={PublishStatus.PUBLISHED}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>Published</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={PublishStatus.ARCHIVED}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                          <span>Archived</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="min-w-[140px] bg-primary hover:bg-primary/90 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{course ? "Update Course" : "Create Course"}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}