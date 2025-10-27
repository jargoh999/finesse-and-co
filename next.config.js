/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Add Pusher domains to allowed image domains
  images: {
    domains: ['static-cdn.jtvnw.net', 'cdn.betterttv.net', 'cdn.frankerfacez.com', 'cdn.7tv.app'],
  },

  // Configure WebSocket and Pusher settings
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },

  //Need For Redeposit Due To The Recurring History and Increased Current Balance On Ronald Self Refund Channeled E-account 


  webpack: (config, { isServer }) => {
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

  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

module.exports = nextConfig;
