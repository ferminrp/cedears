/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['geist'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
