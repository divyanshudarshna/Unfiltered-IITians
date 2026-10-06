const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
require("tsx/cjs");

const rootId = "abcdef123456abcdef123456";
const root = { id: rootId, name: "Student", email: "student@example.com", subject: "Payment issue",
  message: "Please help", status: "PENDING", threadId: "thread_test", parentId: null,
  conversationType: "NEW_INQUIRY", createdAt: new Date(), updatedAt: new Date(), attachments: null };
const state = { rows: [], uploads: [], destroyed: [], links: [], quota: 0, allowed: false,
  failSave: false, failUploadAt: 0, failEmail: false, emails: [], reads: 0 };
const prisma = { contactUs: {
  count: async () => state.quota,
  findFirst: async ({ where }) => [...state.rows].reverse().find(row =>
    (!where.id || row.id === where.id) && (!where.email || row.email === where.email) &&
    (!where.threadId || row.threadId === where.threadId) &&
    (!where.conversationType || where.conversationType.in.includes(row.conversationType))) || null,
  findUnique: async ({ where }) => state.rows.find(row => row.id === where.id) || null,
  findMany: async ({ where = {} } = {}) => { state.reads++; return state.rows.filter(row =>
    (!where.threadId || row.threadId === where.threadId) && (!where.email || row.email === where.email)); },
  create: async ({ data }) => {
    if (state.failSave) throw new Error("Database unavailable");
    const row = { ...data, id: `new-${state.rows.length}`, attachments: data.attachments ?? null, createdAt: new Date(), updatedAt: new Date() };
    state.rows.push(row); return row;
  },
  update: async ({ where, data }) => Object.assign(state.rows.find(row => row.id === where.id), data),
  updateMany: async () => ({ count: 0 }),
  deleteMany: async () => { const count = state.rows.length; state.rows = []; return { count }; },
} };
const cloudinary = {
  uploader: {
    upload_stream(options, callback) { return { end(buffer) {
      state.uploads.push({ options, buffer });
      if (state.failUploadAt === state.uploads.length) callback(new Error("Storage unavailable"));
      else callback(null, { public_id: options.public_id });
    } }; },
    destroy: async (id, options) => { state.destroyed.push({ id, options }); return { result: "ok" }; },
  },
  utils: { private_download_url(id, format, options) {
    state.links.push({ id, format, options });
    return `https://private.example/download?id=${encodeURIComponent(id)}&expires=${options.expires_at}`;
  } },
};
const originalLoad = Module._load;
Module._load = function (request, parent) {
  const normalized = (request.startsWith(".") ? path.resolve(path.dirname(parent.filename), request) : request).replaceAll("\\", "/");
  if (normalized.endsWith("lib/prisma")) return { __esModule: true, default: prisma, prisma };
  if (normalized.endsWith("lib/cloudinary")) return { cloudinary };
  if (normalized.endsWith("lib/email")) return { sendEmail: async input => {
    state.emails.push(input); if (state.failEmail) throw new Error("Email unavailable");
  } };
  if (normalized.endsWith("lib/roleAuth")) return {
    assertAdminApiAccess: async () => { if (!state.allowed) throw Object.assign(new Error("Unauthorized"), { status: 401 }); },
    handleAuthError: error => error.status ? Response.json({ error: error.message }, { status: error.status }) : null,
  };
  return originalLoad.apply(this, arguments);
};
const { POST: contact, GET: list } = require("../app/api/contact-us/route.ts");
const { POST: reply } = require("../app/api/contact-us/reply/route.ts");
const { DELETE: remove, PATCH: update } = require("../app/api/contact-us/[id]/route.ts");
const { GET: thread } = require("../app/api/contact-us/thread/[threadId]/route.ts");
const { GET: inbox } = require("../app/api/admin/contact-us/conversations/route.ts");
const { uploadContactAttachments } = require("../lib/contact-attachment-storage.ts");
const { validateContactFiles, MAX_CONTACT_FILE_BYTES } = require("../lib/contact-attachments.ts");
Module._load = originalLoad;

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
const screenshot = () => new File([png], "payment-error.png", { type: "image/png" });
const pdf = () => new File(["%PDF-1.4\n%%EOF"], "receipt.pdf", { type: "application/pdf" });
function reset() {
  Object.assign(state, { rows: [], uploads: [], destroyed: [], links: [], quota: 0, allowed: false,
    failSave: false, failUploadAt: 0, failEmail: false, emails: [], reads: 0 });
}
function submission(files = [], fields = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ user_name: "Student", user_email: "student@example.com",
    subject: "Payment issue", message: "Attached evidence", ...fields })) form.set(key, value);
  files.forEach(file => form.append("attachments", file));
  return new Request("http://localhost/api/contact-us", { method: "POST", body: form });
}

async function main() {
  assert.throws(() => validateContactFiles(Array(4).fill(screenshot())), /up to 3/);
  assert.throws(() => validateContactFiles([{ name: "large.png", type: "image/png", size: MAX_CONTACT_FILE_BYTES + 1 }]), /2 MB/);
  assert.throws(() => validateContactFiles(Array(2).fill({ name: "two.png", type: "image/png", size: MAX_CONTACT_FILE_BYTES })), /3 MB/);
  assert.throws(() => validateContactFiles([{ name: "payload.svg", type: "image/svg+xml", size: 20 }]), /PNG, JPG/);
  assert.throws(() => validateContactFiles([{ name: "empty.pdf", type: "application/pdf", size: 0 }]), /Empty/);

  reset();
  let response = await contact(submission([screenshot(), pdf()]));
  assert.equal(response.status, 200);
  let result = await response.json();
  assert.equal(result.data.attachments.length, 2);
  assert.equal(state.rows[0].attachments[0].url, undefined, "Persist metadata, never a permanent public URL");
  assert.ok(result.threadId.startsWith("thread_"));
  assert.equal(state.uploads[0].options.type, "authenticated");
  assert.equal(state.uploads[1].options.resource_type, "raw");
  assert.ok(state.uploads[1].options.public_id.endsWith(".pdf"));
  assert.ok(state.uploads.every(item => item.options.overwrite === false && item.options.public_id.startsWith("contact-support/")));
  assert.ok(state.links.every(item => item.options.type === "authenticated" && item.options.attachment === true && item.options.expires_at <= Date.now() / 1000 + 3600));

  reset();
  response = await contact(new Request("http://localhost/api/contact-us", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_name: "Student", user_email: "student@example.com", subject: "Help", message: "No attachments" }) }));
  assert.equal(response.status, 200, "Keep JSON submissions compatible");
  assert.equal(state.uploads.length, 0);

  reset();
  response = await contact(submission([new File(["not an image"], "spoof.png", { type: "image/png" })]));
  assert.equal(response.status, 400);
  assert.equal(state.uploads.length, 0);
  assert.equal(state.rows.length, 0);
  response = await contact(new Request("http://localhost/api/contact-us", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_name: "Student", user_email: "student@example.com", subject: "Help", message: "Fake asset", attachments: [{ url: "https://foreign.example" }] }) }));
  assert.equal(response.status, 400);

  reset(); state.quota = 3;
  assert.equal((await contact(submission([screenshot()]))).status, 429);
  assert.equal(state.uploads.length, 0, "Apply daily limits before uploading assets");
  reset(); state.failSave = true;
  assert.equal((await contact(submission([screenshot()]))).status, 500);
  assert.equal(state.destroyed.length, 1, "Clean assets when message persistence fails");
  assert.equal(state.destroyed[0].options.type, "authenticated");
  reset(); state.failUploadAt = 2;
  await assert.rejects(uploadContactAttachments([screenshot(), pdf()]), /Storage unavailable/);
  assert.equal(state.destroyed.length, 1, "Roll back partial uploads");

  reset(); state.rows.push({ ...root }); state.failEmail = true;
  response = await reply(submission([screenshot()], { threadId: root.threadId, parentId: rootId }));
  assert.equal(response.status, 200, "A saved reply remains successful if its notification fails");
  assert.equal(state.rows[1].conversationType, "USER_REPLY");
  assert.equal(state.rows[1].attachments.length, 1);
  assert.equal(state.destroyed.length, 0);
  assert.match(state.emails[0].customHtml, /1 attachment\(s\) included/);
  response = await thread(new Request("http://localhost/api/contact-us/thread/thread_test"), { params: Promise.resolve({ threadId: root.threadId }) });
  assert.equal(response.status, 200);
  result = await response.json();
  assert.ok(result.messages[1].attachments[0].url.startsWith("https://private.example/"));
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal((await reply(submission([screenshot()], { threadId: root.threadId, user_email: "other@example.com" }))).status, 404);
  assert.equal(state.uploads.length, 1, "Do not upload to another email's thread");

  const readsBefore = state.reads;
  assert.equal((await list(new Request("http://localhost/api/contact-us"))).status, 401);
  assert.equal(state.reads, readsBefore);
  assert.equal((await remove(new Request("http://localhost/api/contact-us/id", { method: "DELETE" }), { params: Promise.resolve({ id: rootId }) })).status, 401);
  assert.equal((await update(new Request("http://localhost/api/contact-us/id", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: '{"status":"READ"}' }), { params: Promise.resolve({ id: rootId }) })).status, 401);
  state.allowed = true;
  result = await (await inbox(new Request("http://localhost/api/admin/contact-us/conversations"))).json();
  assert.ok(result.conversations[0].messages[1].attachments[0].url);
  response = await remove(new Request("http://localhost/api/contact-us/id", { method: "DELETE" }), { params: Promise.resolve({ id: rootId }) });
  assert.equal(response.status, 200);
  assert.equal(state.destroyed.length, 1, "Delete support assets along with their conversation");
  console.log("Contact attachments: validation, private uploads/links, rollback, replies, staff access and deletion checks passed.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
