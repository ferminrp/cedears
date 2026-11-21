import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: siteConfig.name,
    short_name: 'CEDEARs',
    description: siteConfig.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    // Match the page canvas so the splash screen and status bar don't flash a different tone.
    background_color: '#ffffff',
    theme_color: '#ffffff',
    categories: ['finance'],
    shortcuts: [
      { name: 'Portfolio', url: '/portfolio' },
      { name: 'Dólar MEP', url: '/dolar-mep' },
      { name: 'Ratios', url: '/ratios' },
    ],
    lang: 'es-AR',
    icons: [
      {
        src: '/pwa/icon-192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/pwa/icon-512',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/pwa/icon-512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
