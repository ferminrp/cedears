import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getCedears } from '@/lib/get-cedears'
import { CedearsList } from '@/components/cedears-list'
import { SiteFooter, footerLinkClassName } from '@/components/site-footer'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getSiteUrl, siteConfig, buildPageOpenGraph } from '@/lib/site'
import {
  buildHomeIntro,
  buildHomeJsonLd,
} from '@/lib/agent-resources'

export const revalidate = 300

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
  const jsonLd = buildHomeJsonLd({
    siteUrl: getSiteUrl(),
    cedearCount,
    organization: siteConfig.organization,
  })

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

async function HomeCedearsPanel() {
  try {
    const cedears = await getCedears()
    return <CedearsList cedears={cedears} />
  } catch {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar los datos</AlertTitle>
        <AlertDescription>
          No se pudo obtener la lista de CEDEARs. Intentá recargar la página en unos
          minutos.
        </AlertDescription>
      </Alert>
    )
  }
}

export default function Page() {
  const siteUrl = getSiteUrl()
  const intro = buildHomeIntro({
    siteUrl,
    brandName: siteConfig.name,
  })

  return (
    <>
      <HomeJsonLd cedearCount={0} />
      <header className="flex flex-col gap-4">
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          {siteConfig.name}
        </h1>
        <p className="text-pretty text-sm text-muted-foreground">
          Listado completo de CEDEARs cotizados en BYMA, publicado en cedears.com.
        </p>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          {intro}
        </p>
      </header>

      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Cargando listado de CEDEARs…</p>
        }
      >
        <HomeCedearsPanel />
      </Suspense>

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
          (BYMA), en pesos argentinos. {siteConfig.name} reúne todos los CEDEARs
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
    </>
  )
}
