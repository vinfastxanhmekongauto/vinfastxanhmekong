import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  generateBuildId: async () => {
    // Cố định Build ID để tránh lệch manifest trên server deploy chập chờn
    return 'vinfast-fixed-id';
  },
  experimental: {
  },
  images: {
    formats: ['image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ],
  },
};

export default nextConfig;
