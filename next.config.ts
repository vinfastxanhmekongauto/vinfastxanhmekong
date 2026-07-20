import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  generateBuildId: async () => {
    // Cố định Build ID để tránh lệch manifest trên server deploy chập chờn
    return 'vinfast-fixed-id';
  },
  experimental: {
  },
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ],
  },
};

export default nextConfig;
