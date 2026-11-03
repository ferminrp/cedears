/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
  serverExternalPackages: ['yahoo-finance2'],
  // Keep title/description/canonical in the initial <head> for crawlers (vinext streams
  // dynamic generateMetadata into the body otherwise). patches/vinext*.patch makes this
  // also cover requests with no User-Agent, which vinext otherwise always streams.
  htmlLimitedBots: /.*/,
}

export default nextConfig
