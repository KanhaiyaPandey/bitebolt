/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@bitebolt/types', '@bitebolt/utils'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'cdn.bitebolt.in' },
    ],
  },
};

module.exports = nextConfig;
