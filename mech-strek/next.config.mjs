/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint blocking builds (errors go to stdout, not build failure)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors blocking builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow images from any HTTPS host
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: false,
  },
};

export default nextConfig;
