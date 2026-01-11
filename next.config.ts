import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: false, // Fixed: Now properly checking TypeScript errors
  },
  reactStrictMode: true, // Fixed: Enabled for better error detection
  eslint: {
    ignoreDuringBuilds: false, // Fixed: Now properly checking ESLint errors
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization settings
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
