const withNextIntl = require('next-intl/plugin')('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nexus-cards/shared'],
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true, // Changed to true for production builds
  },
  // Optimize bundling and performance
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Improve build performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001',
  },
  images: {
    // Disable image optimization in development to avoid IPv6 localhost connection issues in Docker
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/api/file-upload/**',
      },
      {
        protocol: 'http',
        hostname: 'nexus-api',
        port: '3001',
        pathname: '/api/file-upload/**',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: '/cards/:path*',
        destination: `${apiUrl}/api/cards/:path*`,
      },
      {
        source: '/proxy-image/:path*',
        destination: `${apiUrl}/api/file-upload/:path*`,
      },
    ];
  },
  headers: async () => [
    {
      source: '/sw.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate',
        },
        {
          key: 'Service-Worker-Allowed',
          value: '/',
        },
      ],
    },
    {
      source: '/manifest.json',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};

module.exports = withNextIntl(nextConfig);
