export const siteConfig = {
  name: 'CEDEARs Argentina',
  title: 'Listado completo de CEDEARs en Argentina',
  description:
    'Listado completo y actualizado de CEDEARs (Certificados de Depósito Argentinos) en Argentina. Ticker, empresa, mercado, ratio, precio y variación diaria. Gratis, listo para usar y compartir con agentes de IA.',
  locale: 'es_AR',
  ogImage: {
    url: '/og-image.webp',
    width: 1200,
    height: 630,
    alt: 'Cedears.com — Todos los cedears en un solo lugar',
  },
  keywords: [
    'cedears',
    'cedears argentina',
    'listado cedears',
    'certificados de depósito argentinos',
    'byma cedears',
    'bolsa argentina',
    'inversiones argentina',
    'acciones cedears',
    'ratio cedear',
    'agentes de ia',
    'chatgpt inversiones',
    'datos cedears gratis',
    'earnings cedears',
    'calendario earnings',
  ],
} as const

export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return 'http://localhost:3000'
}

export function buildPageOpenGraph({
  title,
  description,
  url,
}: {
  title: string
  description: string
  url: string
}) {
  return {
    title,
    description,
    url,
    images: [siteConfig.ogImage],
  }
}
