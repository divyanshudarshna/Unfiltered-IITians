// app/api/upload/route.ts
import { NextResponse } from 'next/server'
import { cloudinary } from '@/lib/Cloudinary'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const originalFileName = file.name;
    const fileType = file.type;
    
    // Determine resource type
    let resourceType: any = 'auto';
    
    if (fileType === 'application/pdf' || originalFileName.toLowerCase().endsWith('.pdf')) {
      resourceType = 'raw';
    } else if (fileType.startsWith('video/')) {
      resourceType = 'video';
    } else if (fileType.startsWith('image/')) {
      resourceType = 'image';
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create a clean filename without special characters
    const cleanFileName = originalFileName
      .replace(/\.[^/.]+$/, "") // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with hyphens
      .toLowerCase();

    const uniqueId = uuidv4().slice(0, 8); // Shorter ID
    const publicId = `lecture-content/${cleanFileName}-${uniqueId}`;

    const uploaded = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          resource_type: resourceType,
          public_id: publicId,
          // Critical settings for PDFs
          type: 'upload',
          access_mode: 'public',
          use_filename: false,
          unique_filename: false, // Use our custom public_id
          overwrite: false,
          // PDF-specific settings
          ...(resourceType === 'raw' && {
            format: 'pdf',
            flags: 'attachment',
          }),
        }, 
        (err, result) => {
          if (err) return reject(err)
          resolve(result)
        }
      ).end(buffer)
    })

    const uploadedResult = uploaded as any;
    let fileUrl = uploadedResult.secure_url;

    // Ensure PDFs use raw URL format
    if (resourceType === 'raw' && fileUrl.includes('/image/upload/')) {
      fileUrl = fileUrl.replace('/image/upload/', '/raw/upload/');
    }

    console.log('Upload successful:', {
      originalName: originalFileName,
      cleanFileName,
      publicId,
      finalUrl: fileUrl,
    });

    // Return extended response with publicId for the admin panel
    return NextResponse.json({ 
      url: fileUrl,
      resourceType: resourceType,
      originalFileName: originalFileName,
      publicId: publicId // ✅ Added this line - the only change
    });

  } catch (error) {
    console.error('❌ Upload failed:', error);
    return NextResponse.json({ error: 'Upload failed: ' + (error as Error).message }, { status: 500 });
  }
}