/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed outputFileTracingRoot - not needed for standard deployments
  // and can cause path resolution issues on Vercel

  // Configure image optimization
  images: {
    // Set image domains if needed for external images
    domains: [],
    // Configure image sizes for optimization
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Configure image formats - WebP and AVIF provide better compression
    formats: ['image/webp', 'image/avif'],
    // Limit the size of images to 5MB
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  webpack: (config, { isServer }) => {
    // For mongodb-client-encryption native module
    if (isServer) {
      config.externals.push({
        'mongodb-client-encryption': 'commonjs mongodb-client-encryption',
      });
    } else {
      // Client-side workarounds for Node.js modules
      // Provide empty modules for Node.js built-in modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        http: false,
        https: false,
        path: false,
        stream: false,
        crypto: false,
        zlib: false,
        os: false,
      };
    }

    return config;
  },

  // Add redirects for convenience routes
  async redirects() {
    return [
      {
        source: '/how-it-works',
        destination: '/resources/literature/how-it-works',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
