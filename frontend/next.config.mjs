/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify: true, // Removed as it's no longer needed in Next.js 15+
  output: "standalone",
  // Add proper error handling
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Enable better error logging
  webpack: (config, { isServer, dev }) => {
    // Custom webpack config if needed
    return config;
  },
  // Add basePath support if needed
  // basePath: '/frontend'
};

export default nextConfig;
