import type { Metadata } from 'next'
import Link from 'next/link'
import { getCedears } from '@/lib/get-cedears'
import { CedearsHomeInteractive } from '@/components/cedears-home-interactive'
import { CedearsHomeStaticTable } from '@/components/cedears-home-static-table'
import { CedearsTickerAzIndex } from '@/components/cedears-ticker-az-index'
import { SiteFooter, footerLinkClassName } from '@/components/site-footer'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { absoluteCanonical } from '@/lib/canonical'
import { getSiteUrl, siteConfig, buildPageOpenGraph } from '@/lib/site'
import {
  HOME_INTRO,
  HOME_PAGE_DESCRIPTION,
  HOME_PAGE_TITLE,
  HOME_TABLE_LIMIT,
  buildTickerAzGroups,
  selectHomeTableCedears,
} from '@/lib/home-page'

export const revalidate = 300

export const metadata: Metadata = {
  title: { absolute: HOME_PAGE_TITLE },
  description: HOME_PAGE_DESCRIPTION,
  alternates: {
    canonical: absoluteCanonical('/'),
  },
  openGraph: buildPageOpenGraph({
    title: HOME_PAGE_TITLE,
    description: HOME_PAGE_DESCRIPTION,
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
        name: HOME_PAGE_TITLE,
        description: HOME_PAGE_DESCRIPTION,
        inLanguage: 'es-AR',
        isPartOf: { '@id': `${siteUrl}/#website` },
      },
      {
        '@type': 'Dataset',
        '@id': `${siteUrl}/#dataset`,
        name: 'Listado de CEDEARs en Argentina',
        description:
          'Base de datos gratuita y actualizada de CEDEARs con ticker, empresa, mercado de origen, ratio de conversión, precios ARS/US/MEP/CCL, volumen, prima y tags, lista para exportar y compartir con agentes de IA.',
        inLanguage: 'es-AR',
        isAccessibleForFree: true,
        keywords: siteConfig.keywords.join(', '),
        spatialCoverage: {
          '@type': 'Place',
          name: 'Argentina',
        },
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

function homeTableCaption() {
  return (
    <>
      Mostrando los {HOME_TABLE_LIMIT} CEDEARs con mayor volumen en la tabla. El
      resto del listado está en{' '}
      <Link
        href="/categorias"
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        categorías por temática
      </Link>
      .
    </>
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
    const homeTable = selectHomeTableCedears(cedears)
    const azGroups = buildTickerAzGroups(cedears)
    const caption = homeTableCaption()

    content = (
      <>
        <div className="flex flex-col gap-4">
          <CedearsHomeInteractive tableCaption={caption} />
          <div id="cedears-home-static-block">
            <CedearsHomeStaticTable rows={homeTable} caption={caption} />
          </div>
        </div>
        <div className="max-md:order-2">
          <CedearsTickerAzIndex groups={azGroups} />
        </div>
      </>
    )
  } catch {
    content = (
      <Alert variant="destructive" className="max-md:order-2">
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
      {/* Phones (< md): compact H1, list first, intro right after the list.
          md+: `contents`, so the desktop layout is untouched. */}
      <div className="flex flex-col gap-[var(--space-l)] md:contents">
      <header className="flex flex-col gap-3 max-md:contents">
        <h1 className="text-balance text-[length:var(--size-l)] leading-[var(--line-l)] font-semibold tracking-[var(--letter-spacing-l)] md:text-[length:var(--size-xxl)] md:leading-[var(--line-xxl)] md:tracking-[var(--letter-spacing-xl)]">
          {HOME_PAGE_TITLE}
        </h1>
        <p className="max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground max-md:order-1 md:text-base">
          {HOME_INTRO}
        </p>
      </header>

      {content}

      <section
        aria-labelledby="sobre-cedears"
        className="rounded-[var(--radius-m)] border border-border bg-muted/30 p-6 text-sm leading-relaxed text-muted-foreground max-md:order-2 max-md:p-[var(--space-l)]"
      >
        <h2 id="sobre-cedears" className="mb-2 text-base font-medium text-foreground">
          ¿Qué son los CEDEARs?
        </h2>
        <p>
          Los CEDEARs (Certificados de Depósito Argentinos) permiten invertir en
          acciones de empresas extranjeras desde la Bolsa de Comercio de Buenos Aires
          (BYMA), en pesos argentinos. Este listado reúne CEDEARs disponibles con su
          ratio de conversión, ideal para consultar antes de operar o alimentar
          asistentes de inteligencia artificial con datos confiables.{" "}
          <Link href="/ratios" prefetch={true} className="text-foreground underline underline-offset-4">
            Ver tabla de ratios y calculadora
          </Link>
          . ¿Usás Claude, Cursor o ChatGPT?{" "}
          <a href="/mcp" className="text-foreground underline underline-offset-4">
            Conectá el MCP de CEDEARs
          </a>
          .{" "}
          <Link
            href="/nuevos-cedears"
            className="text-foreground underline underline-offset-4"
          >
            Nuevos CEDEARs en BYMA
          </Link>
          .
        </p>
      </section>

      <div className="max-md:order-2 md:contents">
      <SiteFooter>
        Listado provisto por{' '}
        <a
          href="https://github.com/ferminrp/google-sheets-argento"
          target="_blank"
          rel="noopener noreferrer"
          className={footerLinkClassName}
        >
          google-sheets-argento
        </a>
        . Precios en vivo de{' '}
        <a
          href="https://data912.com"
          target="_blank"
          rel="noopener noreferrer"
          className={footerLinkClassName}
        >
          data912
        </a>
        .{" "}
        <Link href="/nuevos-cedears" className={footerLinkClassName}>
          Nuevos CEDEARs
        </Link>
        .
      </SiteFooter>
      </div>
      </div>
    </>
  )
}
