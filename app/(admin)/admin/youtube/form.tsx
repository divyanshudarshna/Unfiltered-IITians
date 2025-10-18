"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { XIcon } from "lucide-react";

interface Props {
  type: "video" | "category";
  item: any | null;
  onClose: () => void;
}

export default function Form({ type, item, onClose }: Props) {
  const [title, setTitle] = useState(item?.title || item?.name || "");
  const [description, setDescription] = useState(item?.description || item?.desc || "");
  const [link, setLink] = useState(item?.link || "");
  const [categoryId, setCategoryId] = useState(item?.categoryId || "");
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (type === "video") {
      fetch("/api/admin/youtube/category")
        .then(res => res.json())
        .then(setCategories);
    }
  }, [type]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    
    const payload: any = type === "video" 
      ? { title, description, link, categoryId } 
      : { name: title, desc: description };

    const url = item 
      ? `/api/admin/youtube/${type}/${item.id}` 
      : `/api/admin/youtube/${type}`;
      
    const method = item ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      onClose();
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Error saving item. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{item ? "Edit" : "Add New"} {type}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <XIcon className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">{type === "video" ? "Title" : "Name"} *</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder={`Enter ${type === "video" ? "video title" : "category name"}`}
              />
            </div>
            
            {type === "video" && (
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">
              {type === "video" ? "Description" : "Description"} 
              {type === "category" && " (optional)"}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={`Enter ${type} description`}
              rows={3}
            />
          </div>
          
          {type === "video" && (
            <div className="space-y-2">
              <Label htmlFor="link">YouTube Link *</Label>
              <Input
                id="link"
                type="url"
                value={link}
                onChange={e => setLink(e.target.value)}
                required
                placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=... or https://www.youtube.com/embed/..."
              />
              <p className="text-xs text-muted-foreground">
                Supports all YouTube URL formats: embed, watch, and short links (youtu.be)
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : (item ? "Update" : "Add")} {type}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}