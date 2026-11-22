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
  // vinext 1.x renders metadata routes in the cached response stage, so the middleware's
  // CDN-Cache-Control no longer reaches Workers Cache. Declare the sitemap TTL (1h) here.
  async headers() {
    return [
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },
  // Keep title/description/canonical in the initial <head> for crawlers (vinext streams
  // dynamic generateMetadata into the body otherwise).
  htmlLimitedBots: /.*/,
}

export default nextConfig
