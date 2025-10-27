/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `net` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
      };
    }
    return config;
  },
  // WebSocket configuration
  async headers() {
    return [
      {
        source: '/api/socket/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  // Enable experimental features for better WebSocket support
  experimental: {
    serverComponentsExternalPackages: ['socket.io'],
  },
  // Enable WebSocket support in development
  webpackDevMiddleware: (config) => {
    // Watch for changes in the lib directory
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['node_modules/**', '.next/**'],
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
};

module.exports = nextConfig;
