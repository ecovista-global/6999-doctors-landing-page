/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint is verified via the root turbo lint / gates pipeline
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
