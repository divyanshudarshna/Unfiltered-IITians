import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinary } from '@/lib/Cloudinary';
import { v4 as uuidv4 } from 'uuid';

// GET - Get all uploaded files
export async function GET() {
  try {
    const uploads = await prisma.settingsUpload.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(uploads);
  } catch (error) {
    console.error("❌ Error fetching uploads:", error);
    return NextResponse.json({ error: "Failed to fetch uploads" }, { status: 500 });
  }
}

// POST - Upload new file directly to Cloudinary
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const purpose = formData.get('purpose') as string;

    

    if (!file || !title || !purpose) {
      return NextResponse.json({ 
        error: "File, title, and purpose are required" 
      }, { status: 400 });
    }

    // Validate file size (optional: 10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File size too large. Maximum size is 10MB." 
      }, { status: 400 });
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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a clean filename without special characters
    const cleanFileName = originalFileName
      .replace(/\.[^/.]+$/, "") // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with hyphens
      .toLowerCase();

    const uniqueId = uuidv4().slice(0, 8);
    const publicId = `admin-uploads/${cleanFileName}-${uniqueId}`;

    // console.log('☁️ Uploading to Cloudinary...', { publicId, resourceType });

    // Upload directly to Cloudinary
    const uploaded = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          resource_type: resourceType,
          public_id: publicId,
          type: 'upload',
          access_mode: 'public',
          use_filename: false,
          unique_filename: false,
          overwrite: false,
          // PDF-specific settings
          ...(resourceType === 'raw' && {
            format: 'pdf',
            flags: 'attachment',
          }),
        }, 
        (err, result) => {
          if (err) {
            console.error('❌ Cloudinary upload error:', err);
            return reject(err);
          }
          resolve(result);
        }
      ).end(buffer);
    });

    const uploadedResult = uploaded as any;
    let fileUrl = uploadedResult.secure_url;

    // Ensure PDFs use raw URL format
    if (resourceType === 'raw' && fileUrl.includes('/image/upload/')) {
      fileUrl = fileUrl.replace('/image/upload/', '/raw/upload/');
    }

    // console.log('✅ Cloudinary upload successful:', {
    //   url: fileUrl,
    //   publicId: uploadedResult.public_id,
    //   resourceType
    // });

    // Create record in database
    const newUpload = await prisma.settingsUpload.create({
      data: {
        title,
        url: fileUrl,
        fileType: resourceType,
        purpose,
        fileName: originalFileName,
        publicId: uploadedResult.public_id,
      },
    });

    console.log('💾 Database record created:', newUpload.id);

    return NextResponse.json(newUpload);

  } catch (error: any) {
    console.error("❌ Error in admin upload:", error);
    return NextResponse.json({ 
      error: "Failed to upload file",
      details: error.message 
    }, { status: 500 });
  }
}