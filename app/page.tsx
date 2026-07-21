import type { Metadata } from 'next'
import { getCedears } from '@/lib/get-cedears'
import { CedearsList } from '@/components/cedears-list'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter, footerLinkClassName } from '@/components/site-footer'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getSiteUrl, siteConfig, buildPageOpenGraph } from '@/lib/site'

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: {
    canonical: '/',
  },
  openGraph: buildPageOpenGraph({
    title: siteConfig.title,
    description: siteConfig.description,
    url: '/',
  }),
}

function HomeJsonLd({ cedearCount }: { cedearCount: number }) {
  const siteUrl = getSiteUrl()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: siteConfig.name,
        description: siteConfig.description,
        inLanguage: 'es-AR',
      },
      {
        '@type': 'WebPage',
        '@id': `${siteUrl}/#webpage`,
        url: siteUrl,
        name: siteConfig.title,
        description: siteConfig.description,
        inLanguage: 'es-AR',
        isPartOf: { '@id': `${siteUrl}/#website` },
      },
      {
        '@type': 'Dataset',
        '@id': `${siteUrl}/#dataset`,
        name: 'Listado de CEDEARs en Argentina',
        description:
          'Base de datos gratuita y actualizada de CEDEARs con ticker, empresa, mercado de origen, ratio de conversión, precio y variación diaria, lista para exportar y compartir con agentes de IA.',
        inLanguage: 'es-AR',
        isAccessibleForFree: true,
        keywords: siteConfig.keywords.join(', '),
        spatialCoverage: {
          '@type': 'Place',
          name: 'Argentina',
        },
        distribution: [
          {
            '@type': 'DataDownload',
            encodingFormat: 'text/markdown',
            contentUrl: `${siteUrl}/cedears.md`,
          },
          {
            '@type': 'DataDownload',
            encodingFormat: 'text/csv',
            contentUrl: `${siteUrl}/cedears.csv`,
          },
        ],
        variableMeasured: [
          'Ticker CEDEAR',
          'Empresa',
          'Mercado de origen',
          'Precio',
          'Variación porcentual diaria',
          'Ratio de conversión',
          'Ticker original',
        ],
        ...(cedearCount > 0 ? { size: `${cedearCount} CEDEARs` } : {}),
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export default async function Page() {
  let content
  let cedearCount = 0
  let dataLoaded = false

  try {
    const cedears = await getCedears()
    cedearCount = cedears.length
    dataLoaded = true
    content = <CedearsList cedears={cedears} />
  } catch {
    content = (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar los datos</AlertTitle>
        <AlertDescription>
          No se pudo obtener la lista de CEDEARs. Intentá recargar la página en unos
          minutos.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      {dataLoaded && <HomeJsonLd cedearCount={cedearCount} />}
      <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-16">
        <header className="flex flex-col gap-4">
          <SiteNav currentPath="/" />
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {siteConfig.title}
          </h1>
        </header>

        {content}

        <section
          aria-labelledby="sobre-cedears"
          className="rounded-lg border bg-muted/30 p-6 text-sm leading-relaxed text-muted-foreground"
        >
          <h2 id="sobre-cedears" className="mb-2 text-base font-medium text-foreground">
            ¿Qué son los CEDEARs?
          </h2>
          <p>
            Los CEDEARs (Certificados de Depósito Argentinos) permiten invertir en
            acciones de empresas extranjeras desde la Bolsa de Comercio de Buenos Aires
            (BYMA), en pesos argentinos. Este listado reúne todos los CEDEARs
            disponibles con su ratio de conversión, ideal para consultar antes de operar
            o alimentar asistentes de inteligencia artificial con datos confiables.
          </p>
        </section>

        <SiteFooter>
          Listado provisto por{" "}
          <a
            href="https://github.com/ferminrp/google-sheets-argento"
            target="_blank"
            rel="noopener noreferrer"
            className={footerLinkClassName}
          >
            google-sheets-argento
          </a>
          . Precios en vivo de{" "}
          <a
            href="https://data912.com"
            target="_blank"
            rel="noopener noreferrer"
            className={footerLinkClassName}
          >
            data912
          </a>
          .
        </SiteFooter>
      </main>
    </>
  )
}
