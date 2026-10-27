/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['yahoo-finance2'],
  // Keep title/description/canonical in the initial <head> for crawlers (vinext streams
  // dynamic generateMetadata into the body otherwise).
  htmlLimitedBots: /.*/,
}

export default nextConfig
