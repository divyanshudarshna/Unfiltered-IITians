import { Download, FileText } from "lucide-react";
import type { ContactAttachmentLink } from "@/lib/contact-attachments";

export default function AttachmentLinks({ attachments = [] }: { attachments?: ContactAttachmentLink[] }) {
  if (!attachments.length) return null;
  return (
    <ul className="mt-3 space-y-2" aria-label="Message attachments">
      {attachments.map((asset) => (
        <li key={asset.id}>
          <a href={asset.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-card p-3 text-sm text-card-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 break-all">{asset.name} <span className="text-xs text-muted-foreground">({Math.max(1, Math.ceil(asset.size / 1024))} KB)</span></span>
            <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sr-only">Download attachment (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
