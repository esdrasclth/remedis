import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.remedis.brandsofts.com" }],
  },
};

export default nextConfig;
