import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keeps the dev badge off the bottom nav during demos; errors still overlay.
  devIndicators: false,
};

export default nextConfig;
