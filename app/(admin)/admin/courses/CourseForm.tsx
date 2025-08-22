"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CourseFormProps {
  onSuccess: () => void;
  course?: any; // optional for editing
}

export default function CourseForm({ onSuccess, course }: CourseFormProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    actualPrice: "",
    durationMonths: "",
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
      });
    }
  }, [course]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
        }),
      });

      if (!res.ok) throw new Error("Failed to save course");

      toast.success(course ? "Course updated!" : "Course created!");
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Error saving course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input name="title" value={form.title} onChange={handleChange} required />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea name="description" value={form.description} onChange={handleChange} required />
      </div>

      <div>
        <Label>Price</Label>
        <Input type="number" name="price" value={form.price} onChange={handleChange} required />
      </div>

      <div>
        <Label>Discounted Price</Label>
        <Input type="number" name="actualPrice" value={form.actualPrice} onChange={handleChange} required />
      </div>

      <div>
        <Label>Duration (months)</Label>
        <Input type="number" name="durationMonths" value={form.durationMonths} onChange={handleChange} required />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : course ? "Update Course" : "Create Course"}
      </Button>
    </form>
  );
}
