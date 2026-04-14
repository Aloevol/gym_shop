import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
      domains: ["res.cloudinary.com","localhost"],
      remotePatterns: [
          {
              protocol: 'https',
              hostname: 'res.cloudinary.com',
          },
          {
              protocol: 'https',
              hostname: 'thryve.b-cdn.net',
          },
      ],
  },
  experimental: {
      serverActions: {
          bodySizeLimit: '10mb'
      }
  }
};

export default nextConfig;
