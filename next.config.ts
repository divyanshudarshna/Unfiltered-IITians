// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  images: {
    domains: [
      "res.cloudinary.com",
      "images.clerk.dev",
      "img.clerk.com",
    ],
  },
};

export default nextConfig;
