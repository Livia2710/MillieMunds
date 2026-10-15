import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Há outro package-lock.json em C:\Users\livia; fixe o Turbopack neste app.
  turbopack: { root: process.cwd() },
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  // These are public/static assets served by Vercel, not files read by server
  // functions. Excluding them from function traces keeps every route bundle small.
  outputFileTracingExcludes: {
    "/*": ["./public/assets/**/*", "./docs/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
