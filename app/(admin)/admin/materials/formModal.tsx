'use client';

import { useState, useEffect } from 'react';
import { Material, MaterialCategory } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  FileText, 
  Loader2, 
  Save,
  X,
  Upload,
  FileUp,
  Plus,
  Trash2
} from 'lucide-react';

// Text editor imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
} from 'lucide-react';

interface MaterialFormModalProps {
  open: boolean;
  onClose: () => void;
  material?: Material | null;
  categories: MaterialCategory[];
}

interface MaterialWithCategory extends Material {
  subject: MaterialCategory;
}

export default function MaterialFormModal({
  open,
  onClose,
  material,
  categories
}: MaterialFormModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    pdfUrl: '',
    youtubeLink: '',
    tags: [] as string[],
    order: 0,
    published: true,
    subjectId: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Text editor setup
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: formData.content || "",
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[150px] p-3',
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, content: editor.getHTML() }));
    },
  });

  useEffect(() => {
    if (material) {
      setFormData({
        title: material.title,
        slug: material.slug || '',
        content: material.content || '',
        pdfUrl: material.pdfUrl || '',
        youtubeLink: material.youtubeLink || '',
        tags: material.tags || [],
        order: material.order || 0,
        published: material.published,
        subjectId: material.subjectId,
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        content: '',
        pdfUrl: '',
        youtubeLink: '',
        tags: [],
        order: 0,
        published: true,
        subjectId: categories[0]?.id || '',
      });
    }
  }, [material, categories]);

  useEffect(() => {
    if (editor && formData.content) {
      editor.commands.setContent(formData.content);
    }
  }, [editor, formData.content, open]);

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
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
      setFormData(prev => ({ ...prev, pdfUrl: data.url }));
      toast.success("PDF uploaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload PDF");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removePdf = () => {
    setFormData(prev => ({ ...prev, pdfUrl: '' }));
    toast.info("PDF removed");
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = material 
        ? `/api/admin/materials/${material.id}`
        : '/api/admin/materials';
      
      const method = material ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(`Material ${material ? 'updated' : 'created'} successfully`);
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save material');
      }
    } catch (error: any) {
      console.error('Error saving material:', error);
      toast.error(error.message || 'Failed to save material');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {material ? 'Edit Material' : 'Create New Material'}
          </DialogTitle>
          <DialogDescription>
            {material ? 'Update your learning material' : 'Add a new learning material to your library'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Enter material title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="URL-friendly identifier (auto-generated if empty)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subjectId">Category *</Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtubeLink">YouTube Link</Label>
                <Input
                  id="youtubeLink"
                  type="url"
                  value={formData.youtubeLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtubeLink: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                />
                <Label htmlFor="published" className="cursor-pointer">Published</Label>
              </div>
            </div>
          </div>

          {/* PDF Upload */}
          <div className="space-y-2">
            <Label>PDF Document</Label>
            <Card>
              <CardContent className="p-4">
                {formData.pdfUrl ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-green-500" />
                      <span className="text-sm">PDF uploaded</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removePdf}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <FileUp className="h-5 w-5 text-muted-foreground" />
                      <Label htmlFor="pdf-upload" className="cursor-pointer">
                        Upload PDF
                      </Label>
                      <Input
                        id="pdf-upload"
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          e.target.files?.[0] && handleUpload(e.target.files[0])
                        }
                        className="hidden"
                      />
                    </div>
                    {uploading && (
                      <div className="space-y-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Uploading... {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Content Editor */}
          <div className="space-y-2">
            <Label>Content</Label>
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
                      Write your content here...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type and press Enter to add tags"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {material ? 'Update' : 'Create'} Material
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}