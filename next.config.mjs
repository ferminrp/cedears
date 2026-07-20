import withPWAInit, { runtimeCaching } from '@ducanh2912/next-pwa'

const LIVE_DATA_CACHE_NAMES = new Set([
  'pages',
  'pages-rsc',
  'pages-rsc-prefetch',
  'static-data-assets',
])

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  cacheStartUrl: false,
  dynamicStartUrl: false,
  workboxOptions: {
    runtimeCaching: [
      ...runtimeCaching.map((rule) =>
        LIVE_DATA_CACHE_NAMES.has(rule.options?.cacheName ?? '')
          ? { ...rule, handler: 'NetworkOnly' }
          : rule,
      ),
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/api/logo/'),
        handler: 'CacheFirst',
        options: {
          cacheName: 'ticker-logos',
          expiration: {
            maxEntries: 500,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['yahoo-finance2'],
}

export default withPWA(nextConfig)
