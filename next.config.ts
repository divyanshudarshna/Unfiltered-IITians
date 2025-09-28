// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    domains: [
      "res.cloudinary.com",
      "images.clerk.dev",
      "img.clerk.com",
    ],
  },
};

export default nextConfig;
