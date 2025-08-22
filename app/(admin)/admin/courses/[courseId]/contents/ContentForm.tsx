"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  FileText,
  Type,
  ListOrdered,
  Save,
  Plus,
  Edit,
  Loader2
} from "lucide-react";

interface ContentFormProps {
  courseId: string;
  content?: any; // existing content for edit
  onSuccess: () => void;
}

export default function ContentForm({ courseId, content, onSuccess }: ContentFormProps) {
  const [title, setTitle] = useState(content?.title || "");
  const [description, setDescription] = useState(content?.description || "");
  const [order, setOrder] = useState(content?.order || 1); // Default to 1
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (content) {
      setTitle(content.title);
      setDescription(content.description || "");
      setOrder(content.order || 1);
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a title for the content");
      return;
    }

    setLoading(true);

    try {
      const method = content ? "PUT" : "POST";
      const url = content
        ? `/api/admin/contents/${content.id}`
        : `/api/admin/courses/${courseId}/contents`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: title.trim(), 
          description: description.trim(), 
          order: Number(order) || 1 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save content");
      }

      toast.success(content ? "Content updated successfully!" : "Content created successfully!");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save content");
    } finally {
      setLoading(false);
    }
  };

  const incrementOrder = () => {
    setOrder(prev => Number(prev) + 1);
  };

  const decrementOrder = () => {
    if (Number(order) > 1) {
      setOrder(prev => Number(prev) - 1);
    }
  };

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          {content ? (
            <>
              <Edit className="h-5 w-5 text-primary" />
              Edit Content
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 text-primary" />
              Add New Content
            </>
          )}
        </CardTitle>
        <CardDescription>
          {content ? "Update the content details" : "Create a new content module for your course"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter content title"
              className="text-lg border-border/50 focus-visible:ring-primary"
              required
            />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this content module covers"
              className="min-h-[100px] border-border/50 focus-visible:ring-primary"
            />
          </div>

          {/* Order Field with Number Input Controls */}
          <div className="space-y-2">
            <Label htmlFor="order" className="flex items-center gap-2">
              <ListOrdered className="h-4 w-4" />
              Display Order
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={decrementOrder}
                disabled={Number(order) <= 1}
                className="h-10 w-10"
              >
                −
              </Button>
              <Input
                id="order"
                type="number"
                min="1"
                value={order}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || (Number(value) >= 1)) {
                    setOrder(value);
                  }
                }}
                className="text-center text-lg w-20 border-border/50 focus-visible:ring-primary"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={incrementOrder}
                className="h-10 w-10"
              >
                +
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first in the course
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full py-6 text-lg font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                {content ? "Update Content" : "Create Content"}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}