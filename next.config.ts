import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'item-shopping.c.yimg.jp',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'shopping-phinf.pstatic.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tshop.r10s.jp',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
