import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Allow build to continue even if fonts fail to load
  experimental: {
    optimizePackageImports: ['next/font/google'],
  },
};

export default nextConfig;
