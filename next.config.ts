import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  productionBrowserSourceMaps: true,
  experimental: {
    serverSourceMaps: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'cdn.iconscout.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'is1-ssl.mzstatic.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'filebrowser.aliatic.app',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'placehold.org',
        pathname: '/**'
      }
    ],
  },
};

export default nextConfig;
