import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get("publicId");

    if (!publicId) {
      return NextResponse.json({ error: "Missing publicId" }, { status: 400 });
    }

    const signedUrl = cloudinary.url(publicId, {
      resource_type: "raw",
      type: "authenticated",   // important for restricted PDFs
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1h expiry
    });

    return NextResponse.json({ url: signedUrl });
  } catch (err: any) {
    console.error("❌ Signed URL error:", err);
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
  }
}
