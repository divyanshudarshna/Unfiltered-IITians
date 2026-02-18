// app/api/cloudinary-signature/route.ts
// Generates a signed Cloudinary upload signature so the browser can upload
// directly to Cloudinary — bypassing Vercel's 4.5 MB serverless body limit.
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export async function POST(req: Request) {
    try {
        const { fileName, fileType } = await req.json();

        if (!fileName || !fileType) {
            return NextResponse.json({ error: 'fileName and fileType are required' }, { status: 400 });
        }

        // Determine resource type
        let resourceType: 'raw' | 'video' | 'image' | 'auto' = 'auto';
        if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
            resourceType = 'raw';
        } else if (fileType.startsWith('video/')) {
            resourceType = 'video';
        } else if (fileType.startsWith('image/')) {
            resourceType = 'image';
        }

        // Build a clean public_id
        const cleanFileName = fileName
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9-_]/g, '-')
            .toLowerCase();
        const uniqueId = uuidv4().slice(0, 8);
        const publicId = `lecture-content/${cleanFileName}-${uniqueId}`;

        const timestamp = Math.round(Date.now() / 1000);

        // Parameters that MUST match what the browser sends to Cloudinary
        const paramsToSign: Record<string, string | number> = {
            public_id: publicId,
            timestamp,
            type: 'upload',
            access_mode: 'public',
            overwrite: 'false',
            use_filename: 'false',
            unique_filename: 'false',
        };

        if (resourceType === 'raw') {
            paramsToSign.format = 'pdf';
            paramsToSign.flags = 'attachment';
        }

        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            process.env.CLOUDINARY_API_SECRET!
        );

        return NextResponse.json({
            signature,
            timestamp,
            publicId,
            resourceType,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            // Extra params the browser must include in the upload form
            extraParams: paramsToSign,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate signature';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
