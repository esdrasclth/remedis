import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.remedis.com" },
    ],
  },
  serverExternalPackages: ["@prisma/client", "pg"],
};

export default nextConfig;
