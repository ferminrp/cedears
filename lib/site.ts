export const siteConfig = {
  name: 'CEDEARs Argentina',
  alternateNames: ['cedears.com', 'Cedears.com', 'CEDEARs Argentina (cedears.com)'],
  githubRepo: 'https://github.com/ferminrp/cedears',
  title: 'CEDEARs Argentina — listado completo de CEDEARs en BYMA',
  description:
    'CEDEARs Argentina (cedears.com): listado completo y actualizado de Certificados de Depósito Argentinos en BYMA. Ticker, empresa, mercado, ratio, precio y variación diaria. Gratis, listo para usar y compartir con agentes de IA.',
  locale: 'es_AR',
  ogImage: {
    url: '/og-image.webp',
    width: 1200,
    height: 630,
    alt: 'CEDEARs Argentina (cedears.com) — Todos los CEDEARs en un solo lugar',
  },
  keywords: [
    'cedears',
    'cedears argentina',
    'cedears.com',
    'CEDEARs Argentina',
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
  organization: {
    email: 'frodriguezpenelas@gmail.com',
    contactType: 'customer support',
    contactUrl: 'https://github.com/ferminrp/cedears/issues',
    address: {
      addressLocality: 'Buenos Aires',
      addressRegion: 'CABA',
      addressCountry: 'AR',
    },
    sameAs: [
      'https://github.com/ferminrp/cedears',
      'https://github.com/ferminrp',
      'https://ferminrp.com',
      'https://x.com/ferminrp',
    ],
  },
} as const

export type SiteOrganization = typeof siteConfig.organization

export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
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
