// next.config.js or next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "res.cloudinary.com", // Cloudinary uploads
      "images.clerk.dev",   // Clerk's default images
      "img.clerk.com",      // Clerk proxy image URLs (Google auth, etc.)
    ],
  },
};

export default nextConfig;
