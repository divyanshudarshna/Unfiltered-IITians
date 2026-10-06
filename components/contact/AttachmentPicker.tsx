"use client";

import { useEffect, useId, useState } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTACT_ATTACHMENT_ACCEPT, validateContactFiles } from "@/lib/contact-attachments";

export default function AttachmentPicker({ files, onChange, disabled = false }: {
  files: File[]; onChange: (files: File[]) => void; disabled?: boolean;
}) {
  const id = useId();
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    const urls = files.map((file) => file.type.startsWith("image/") ? URL.createObjectURL(file) : "");
    setPreviews(urls);
    return () => urls.forEach((url) => { if (url) URL.revokeObjectURL(url); });
  }, [files]);

  return (
    <div className="space-y-3">
      <Label htmlFor={id} className="flex items-center gap-2">
        <Paperclip className="h-4 w-4" aria-hidden="true" /> Screenshots / attachments (optional)
      </Label>
      <Input id={id} type="file" multiple accept={CONTACT_ATTACHMENT_ACCEPT} disabled={disabled}
        aria-describedby={`${id}-help`} className="cursor-pointer"
        onChange={(event) => {
          const next = [...files];
          for (const file of Array.from(event.target.files || [])) {
            if (!next.some((old) => old.name === file.name && old.size === file.size && old.lastModified === file.lastModified)) next.push(file);
          }
          try { validateContactFiles(next); onChange(next); }
          catch (error) { toast.error(error instanceof Error ? error.message : "Unable to attach these files."); }
          event.target.value = "";
        }} />
      <p id={`${id}-help`} className="text-xs text-muted-foreground">
        Up to 3 PNG, JPG, WebP or PDF files. Maximum 2 MB each, 3 MB combined.
      </p>
      {files.length > 0 && (
        <ul className="space-y-2" aria-label="Selected attachments">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.lastModified}-${file.size}`} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-muted/40 p-2">
              {previews[index] ? (
                // Local object URLs only; released when removed or unmounted.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previews[index]} alt={`Preview of ${file.name}`} className="h-12 w-12 rounded-[var(--radius-sm)] object-cover" />
              ) : <FileText className="h-8 w-8 shrink-0 text-muted-foreground" aria-hidden="true" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{Math.max(1, Math.ceil(file.size / 1024))} KB</p>
              </div>
              <Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={`Remove ${file.name}`}
                onClick={() => onChange(files.filter((_, i) => i !== index))}>
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
