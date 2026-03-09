/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
        pathname: '/**',
      },
    ],
  },
  // Next.js 16: serverExternalPackages (replaces experimental.serverComponentsExternalPackages)
  serverExternalPackages: ['bcryptjs'],
  // Next.js 16: required when webpack config exists (avoids Turbopack vs webpack error)
  turbopack: {},
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
}

module.exports = nextConfig
