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
    background_color: '#f5f4f1',
    theme_color: '#f5f4f1',
    orientation: 'portrait-primary',
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
