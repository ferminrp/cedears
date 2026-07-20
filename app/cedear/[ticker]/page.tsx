import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CedearDetailView } from "@/components/cedear-detail-view"
import { CedearFaqs } from "@/components/cedear-faqs"
import { CedearPriceChart } from "@/components/cedear-price-chart"
import { SiteNav } from "@/components/site-nav"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buildCedearFaqs } from "@/lib/cedear-faqs"
import { formatArs } from "@/lib/cedears"
import { getCedearBases, getCedearByTicker } from "@/lib/get-cedears"
import { getCedearHistorical } from "@/lib/historical"
import { logoUrl } from "@/lib/logo"
import { getSiteUrl } from "@/lib/site"

export const revalidate = 60

type PageProps = {
  params: Promise<{ ticker: string }>
}

export async function generateStaticParams() {
  const bases = await getCedearBases()
  return bases.map((cedear) => ({ ticker: cedear.Cedears }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ticker } = await params
  let cedear: Awaited<ReturnType<typeof getCedearByTicker>>
  try {
    cedear = await getCedearByTicker(ticker)
  } catch {
    return {
      title: "Error al cargar los datos",
      robots: { index: false, follow: false },
    }
  }

  if (!cedear) {
    return {
      title: "CEDEAR no encontrado",
      robots: { index: false, follow: false },
    }
  }

  const title = `CEDEAR ${cedear.Cedears} — ${cedear.Name}`
  const priceSnippet =
    cedear.price !== null ? ` Cotiza a ${formatArs(cedear.price)}.` : ""
  const description = `¿Existe CEDEAR de ${cedear.TickerOriginal}? Sí: ${cedear.Cedears} (${cedear.Name}). Ratio ${cedear.Ratio}:1, precio, MEP, cable y gráfico histórico.${priceSnippet}`
  const canonical = `/cedear/${cedear.Cedears}`

  return {
    title,
    description,
    keywords: [
      `cedear ${cedear.TickerOriginal}`,
      `existe cedear de ${cedear.TickerOriginal}`,
      `cedear ${cedear.Cedears}`,
      cedear.Name.toLowerCase(),
      "cedears argentina",
      "byma",
    ],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
    },
  }
}

function CedearJsonLd({
  cedear,
  faqs,
}: {
  cedear: NonNullable<Awaited<ReturnType<typeof getCedearByTicker>>>
  faqs: ReturnType<typeof buildCedearFaqs>
}) {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/cedear/${cedear.Cedears}`

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `CEDEAR ${cedear.Cedears} — ${cedear.Name}`,
        description: `Información del CEDEAR ${cedear.Cedears} (${cedear.Name}) en Argentina.`,
        inLanguage: "es-AR",
        isPartOf: { "@id": `${siteUrl}/#website` },
      },
      {
        "@type": "FinancialProduct",
        name: `CEDEAR ${cedear.Cedears}`,
        description: `Certificado de Depósito Argentino de ${cedear.Name} (${cedear.TickerOriginal}).`,
        category: "CEDEAR",
        provider: {
          "@type": "Organization",
          name: "BYMA",
        },
        identifier: cedear.Cedears,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
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

export default async function CedearPage({ params }: PageProps) {
  const { ticker } = await params
  let cedear: Awaited<ReturnType<typeof getCedearByTicker>>
  try {
    cedear = await getCedearByTicker(ticker)
  } catch {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-8 px-4 py-10 md:py-16">
        <header className="flex flex-col gap-4">
          <SiteNav currentPath="/" />
        </header>
        <Alert variant="destructive">
          <AlertTitle>Error al cargar los datos</AlertTitle>
          <AlertDescription>
            No se pudo obtener la información del CEDEAR. Intentá recargar la página en
            unos minutos.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  if (!cedear) {
    notFound()
  }

  const [history, faqs] = await Promise.all([
    getCedearHistorical(cedear.Cedears),
    Promise.resolve(buildCedearFaqs(cedear)),
  ])

  return (
    <>
      <CedearJsonLd cedear={cedear} faqs={faqs} />
      <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-8 px-4 py-10 md:py-16">
        <header className="flex flex-col gap-4">
          <SiteNav currentPath="/" />
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Listado
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="font-medium text-foreground">{cedear.Cedears}</li>
            </ol>
          </nav>
          <div className="flex items-start gap-4">
            <img
              src={logoUrl(cedear.TickerOriginal)}
              alt=""
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-md bg-muted object-contain"
            />
            <div className="min-w-0">
              <h1 className="font-mono text-3xl font-semibold tracking-tight md:text-4xl">
                CEDEAR {cedear.Cedears}
              </h1>
              <p className="mt-1 text-lg text-muted-foreground">{cedear.Name}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Sí, existe CEDEAR de {cedear.TickerOriginal} en Argentina. Operás
                bajo el ticker {cedear.Cedears} en BYMA, con ratio {cedear.Ratio}:1
                respecto a la acción en {cedear.Market}.
              </p>
            </div>
          </div>
        </header>

        <section
          aria-labelledby="cotizacion-heading"
          className="rounded-lg border bg-card p-6"
        >
          <h2 id="cotizacion-heading" className="text-xl font-semibold tracking-tight">
            Cotización y datos
          </h2>
          <CedearDetailView cedear={cedear} />
        </section>

        <section
          aria-labelledby="historico-heading"
          className="rounded-lg border bg-card p-6"
        >
          <h2 id="historico-heading" className="mb-4 text-xl font-semibold tracking-tight">
            Precio histórico
          </h2>
          <CedearPriceChart ticker={cedear.Cedears} history={history} />
        </section>

        <CedearFaqs faqs={faqs} />

        <footer className="mt-auto border-t pt-6 text-sm text-muted-foreground">
          <Link href="/" className="font-medium text-foreground underline underline-offset-4">
            Volver al listado completo
          </Link>
          {" · "}
          Datos de{" "}
          <a
            href="https://data912.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-4"
          >
            data912
          </a>
          .
        </footer>
      </main>
    </>
  )
}
