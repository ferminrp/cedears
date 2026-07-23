/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['yahoo-finance2'],
}

export default nextConfig
