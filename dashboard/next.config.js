/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Railway: emits a self-contained server in .next/standalone/
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
};

module.exports = nextConfig;
