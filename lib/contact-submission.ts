import { ContactInputError, validateContactFiles } from "./contact-attachments";

export async function readContactSubmission(req: Request, reply = false) {
  // Stay below Vercel's request limit, including multipart overhead and message text.
  if (Number(req.headers.get("content-length")) > 4 * 1024 * 1024) {
    throw new ContactInputError("Message and attachments are too large.", 413);
  }
  let body: Record<string, unknown>;
  let files: File[] = [];
  try {
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await req.formData();
      body = Object.fromEntries(form.entries());
      const entries = form.getAll("attachments");
      if (entries.some((entry) => typeof entry === "string")) {
        throw new ContactInputError("Attachments must be uploaded files.");
      }
      files = entries as File[];
    } else {
      body = await req.json();
      if (body?.attachments !== undefined) {
        throw new ContactInputError("Use file uploads to attach evidence, not attachment URLs.");
      }
    }
  } catch (error) {
    if (error instanceof ContactInputError) throw error;
    throw new ContactInputError("Invalid contact submission.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ContactInputError("Invalid contact submission.");
  }
  const text = (key: string, max: number, required = true) => {
    const value = body[key];
    if (value === undefined || value === null || value === "") {
      if (!required) return undefined;
      throw new ContactInputError("Missing required fields.");
    }
    if (typeof value !== "string" || !value.trim() || value.length > max) {
      throw new ContactInputError(`Invalid ${key.replace("user_", "")} field.`);
    }
    return value.trim();
  };
  const user_name = text("user_name", 150)!;
  const user_email = text("user_email", 254)!.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user_email)) {
    throw new ContactInputError("Invalid email format.");
  }
  const subject = text("subject", 250, !reply);
  const message = text("message", 10000)!;
  const threadId = text("threadId", 150, reply);
  const parentId = text("parentId", 24, false);
  if (parentId && !/^[a-f\d]{24}$/i.test(parentId)) {
    throw new ContactInputError("Invalid parent message.");
  }
  validateContactFiles(files);
  return { user_name, user_email, subject, message, threadId, parentId, files };
}
