import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site'

const shortcutIcon = { src: '/pwa/icon-192', sizes: '192x192', type: 'image/png' }

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
      { name: 'Portfolio', url: '/portfolio', icons: [shortcutIcon] },
      { name: 'Dólar MEP', url: '/dolar-mep', icons: [shortcutIcon] },
      { name: 'Ratios', url: '/ratios', icons: [shortcutIcon] },
    ],
    lang: 'es-AR',
    icons: [
      {
        src: '/pwa/icon-192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa/icon-512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa/icon-maskable-512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
