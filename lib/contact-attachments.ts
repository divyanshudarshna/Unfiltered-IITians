export const MAX_CONTACT_ATTACHMENTS = 3;
export const MAX_CONTACT_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_CONTACT_TOTAL_BYTES = 3 * 1024 * 1024;
export const CONTACT_ATTACHMENT_ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";

export type ContactAttachment = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  publicId: string;
  resourceType: "image" | "raw";
  format: string;
};

export type ContactAttachmentLink = ContactAttachment & { url: string };

export class ContactInputError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "ContactInputError";
  }
}

const extensions: Record<string, string[]> = {
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/webp": ["webp"],
  "application/pdf": ["pdf"],
};

export function validateContactFiles(files: Pick<File, "name" | "size" | "type">[]) {
  if (files.length > MAX_CONTACT_ATTACHMENTS) {
    throw new ContactInputError("Attach up to 3 files per message.");
  }
  let total = 0;
  for (const file of files) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!extensions[file.type]?.includes(extension)) {
      throw new ContactInputError("Attachments must be PNG, JPG, WebP images or PDF files.");
    }
    if (file.size <= 0) throw new ContactInputError("Empty files cannot be attached.");
    if (file.size > MAX_CONTACT_FILE_BYTES) {
      throw new ContactInputError("Each attachment must be 2 MB or smaller.", 413);
    }
    total += file.size;
  }
  if (total > MAX_CONTACT_TOTAL_BYTES) {
    throw new ContactInputError("Attachments must total 3 MB or less.", 413);
  }
}

export function readContactAttachments(value: unknown): ContactAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ContactAttachment =>
    !!item && typeof item === "object" &&
    typeof item.id === "string" && typeof item.name === "string" &&
    typeof item.size === "number" && typeof item.mimeType === "string" &&
    typeof item.publicId === "string" && item.publicId.startsWith("contact-support/") &&
    (item.resourceType === "image" || item.resourceType === "raw") &&
    typeof item.format === "string"
  );
}
