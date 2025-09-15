import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PWA 및 보안 설정
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // PWA 아이콘 최적화
  async rewrites() {
    return [
      {
        source: "/sw.js",
        destination: "/_next/static/sw.js",
      },
    ];
  },
};

export default nextConfig;
