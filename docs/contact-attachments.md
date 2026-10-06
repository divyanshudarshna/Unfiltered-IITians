# Contact screenshots and attachments

The existing `/contact` form and conversation reply form accept PNG, JPG/JPEG, WebP and PDF files. `/contact-us` redirects to `/contact`. Users can select up to three files, preview images, and remove files before sending. Limits are 2 MB per file and 3 MB combined to stay below Vercel's request-body limit.

Files are uploaded by the contact API using the existing server-side Cloudinary configuration (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`). They use authenticated assets under `contact-support/`, not public uploads. Metadata is saved in the optional `ContactUs.attachments` JSON field. Staff and the existing email-reply conversation link receive signed download URLs valid for one hour; refresh the conversation to renew expired links.

The API validates file counts, total size, MIME types, extensions and content signatures before upload. Quota and conversation checks run before uploads. Partial uploads and uploads belonging to failed database saves are cleaned up. Deleting a conversation also deletes its assets. Conversation listing, status updates and deletion require support/admin access.

Run `npm run test:contact` for route-level tests with mocked database, Cloudinary and email services. The checks cover private upload options, signed links, content rejection, limits, JSON compatibility, rollback, threaded replies, notification failure, staff authorization and asset deletion.

Prisma Client has been regenerated locally. Deployment must regenerate it from the updated schema (the project's existing `postinstall` does this). The new MongoDB field is optional: existing conversations remain compatible, and no destructive migration or database reset is needed. A live upload/download test still needs to be completed after deployment using the production Cloudinary configuration.
