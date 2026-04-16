import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
      remotePatterns: [
          {
              protocol: 'https',
              hostname: 'res.cloudinary.com',
          },
          {
              protocol: 'https',
              hostname: 'thryve.b-cdn.net',
          },
          {
              protocol: 'http',
              hostname: 'localhost',
          },
          {
              protocol: 'https',
              hostname: 'localhost',
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
