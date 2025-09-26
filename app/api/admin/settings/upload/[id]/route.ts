import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinary } from '@/lib/Cloudinary';

interface Params {
  params: Promise<{ id: string }>;
}

// GET - Get specific upload
export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params;

    const upload = await prisma.settingsUpload.findUnique({
      where: { id },
    });

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    return NextResponse.json(upload);
  } catch (error) {
    console.error("❌ Error fetching upload:", error);
    return NextResponse.json({ error: "Failed to fetch upload" }, { status: 500 });
  }
}

// PUT - Update upload title/purpose
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { title, purpose } = await req.json();

    if (!title || !purpose) {
      return NextResponse.json({ error: "Title and purpose are required" }, { status: 400 });
    }

    const updatedUpload = await prisma.settingsUpload.update({
      where: { id },
      data: { title, purpose },
    });

    return NextResponse.json(updatedUpload);
  } catch (error) {
    console.error("❌ Error updating upload:", error);
    return NextResponse.json({ error: "Failed to update upload" }, { status: 500 });
  }
}

// DELETE - Remove upload (delete from Cloudinary + database)
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id } = await params;

    // Get upload record first
    const upload = await prisma.settingsUpload.findUnique({
      where: { id },
    });

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(upload.publicId, {
        resource_type: upload.fileType === 'raw' ? 'raw' : 
                      upload.fileType === 'video' ? 'video' : 'image'
      });
    } catch (cloudinaryError) {
      console.warn("⚠️ Cloudinary deletion failed, continuing with DB deletion:", cloudinaryError);
    }

    // Delete from database
    await prisma.settingsUpload.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Upload deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting upload:", error);
    return NextResponse.json({ error: "Failed to delete upload" }, { status: 500 });
  }
}