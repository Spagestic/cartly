import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid streaming-metadata tree shape mismatch during hydration (hidden div vs direct boundary).
  htmlLimitedBots: /.*/,
  images: {
    remotePatterns: [
      {
        hostname: "avatars.githubusercontent.com",
      },
      {
        hostname: "*.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "online.citysuper.com.hk",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
    ],
  },
};

export default nextConfig;
