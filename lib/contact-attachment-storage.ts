import { randomUUID } from "node:crypto";
import { cloudinary } from "./cloudinary";
import { ContactInputError, readContactAttachments, validateContactFiles, type ContactAttachment } from "./contact-attachments";

function matchesContent(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/jpeg") return buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  if (mimeType === "image/webp") return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return mimeType === "application/pdf" && buffer.toString("ascii", 0, 5) === "%PDF-";
}

export async function removeContactAttachments(attachments: ContactAttachment[]) {
  await Promise.all(attachments.map(async (asset) => {
    try {
      await cloudinary.uploader.destroy(asset.publicId, { resource_type: asset.resourceType, type: "authenticated", timeout: 10000 });
    } catch (error) {
      console.error("Contact attachment cleanup failed:", error);
    }
  }));
}

export async function uploadContactAttachments(files: File[]): Promise<ContactAttachment[]> {
  validateContactFiles(files);
  if (!files.length) return [];
  const prepared = await Promise.all(files.map(async (file) => {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesContent(buffer, file.type)) {
      throw new ContactInputError("Attachment content does not match its file type.");
    }
    return { file, buffer };
  }));
  const uploaded: ContactAttachment[] = [];
  try {
    for (const { file, buffer } of prepared) {
      const id = randomUUID();
      const resourceType = file.type === "application/pdf" ? "raw" : "image";
      const format = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
      const publicId = `contact-support/${id}${resourceType === "raw" ? ".pdf" : ""}`;
      const result = await new Promise<{ public_id: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream({
          public_id: publicId, resource_type: resourceType, type: "authenticated",
          overwrite: false, timeout: 10000,
          ...(resourceType === "image" ? { allowed_formats: ["png", "jpg", "jpeg", "webp"] } : {}),
        }, (error, result) => {
          if (error || !result) return reject(error || new Error("Attachment upload failed."));
          resolve(result);
        }).end(buffer);
      });
      uploaded.push({ id, name: file.name.replace(/[\x00-\x1f\x7f]/g, "").slice(0, 180),
        size: file.size, mimeType: file.type, publicId: result.public_id, resourceType, format });
    }
    return uploaded;
  } catch (error) {
    await removeContactAttachments(uploaded);
    throw error;
  }
}

export function contactAttachmentLinks(value: unknown) {
  return readContactAttachments(value).map((asset) => ({
    ...asset,
    url: cloudinary.utils.private_download_url(asset.publicId, asset.resourceType === "raw" ? "" : asset.format, {
      resource_type: asset.resourceType, type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + 3600, attachment: true,
    }),
  }));
}
