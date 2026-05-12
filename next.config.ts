import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.remedis.brandsofts.com" },
      { protocol: "https", hostname: "storage.brandsofts.com" },
    ],
  },
  serverExternalPackages: ["@prisma/client", "pg"],
};

export default nextConfig;
