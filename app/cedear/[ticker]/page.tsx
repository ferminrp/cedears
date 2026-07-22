import type { Metadata } from "next"
import Link from "next/link"
import { InfoIcon } from "lucide-react"
import { notFound } from "next/navigation"
import { CedearCompanyProfile } from "@/components/cedear-company-profile"
import { CedearDetailLive } from "@/components/cedear-detail-live"
import { CedearFaqs } from "@/components/cedear-faqs"
import { CedearNews } from "@/components/cedear-news"
import { CedearPriceChart } from "@/components/cedear-price-chart"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buildCedearFaqs } from "@/lib/cedear-faqs"
import { getCompanyNews } from "@/lib/company-news"
import { getCedearBases, getCedearBaseByTicker } from "@/lib/get-cedears"
import type { CedearBase } from "@/lib/get-cedears"
import { getCedearHistorical } from "@/lib/historical"
import { getUnderlyingProfile } from "@/lib/underlying-profile"
import { logoUrl } from "@/lib/logo"
import { getSiteUrl, buildPageOpenGraph } from "@/lib/site"

export const revalidate = 3600

type PageProps = {
  params: Promise<{ ticker: string }>
}

export async function generateStaticParams() {
  const bases = await getCedearBases()
  return bases.map((cedear) => ({ ticker: cedear.Cedears }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ticker } = await params
  const base = await getCedearBaseByTicker(ticker)

  if (!base) {
    return {
      title: "CEDEAR no encontrado",
      robots: { index: false, follow: false },
    }
  }

  const title = `CEDEAR ${base.Cedears} — ${base.Name}`
  const description = `¿Existe CEDEAR de ${base.TickerOriginal}? Sí: ${base.Cedears} (${base.Name}). Ratio ${base.Ratio}:1, precio, MEP, cable y gráfico histórico.`
  const canonical = `/cedear/${base.Cedears}`

  return {
    title,
    description,
    keywords: [
      `cedear ${base.TickerOriginal}`,
      `existe cedear de ${base.TickerOriginal}`,
      `cedear ${base.Cedears}`,
      base.Name.toLowerCase(),
      "cedears argentina",
      "byma",
    ],
    alternates: { canonical },
    openGraph: buildPageOpenGraph({ title, description, url: canonical }),
  }
}

function CedearJsonLd({
  base,
  faqs,
}: {
  base: Pick<CedearBase, "Cedears" | "Name" | "TickerOriginal">
  faqs: ReturnType<typeof buildCedearFaqs>
}) {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/cedear/${base.Cedears}`

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `CEDEAR ${base.Cedears} — ${base.Name}`,
        description: `Información del CEDEAR ${base.Cedears} (${base.Name}) en Argentina.`,
        inLanguage: "es-AR",
        isPartOf: { "@id": `${siteUrl}/#website` },
      },
      {
        "@type": "FinancialProduct",
        name: `CEDEAR ${base.Cedears}`,
        description: `Certificado de Depósito Argentino de ${base.Name} (${base.TickerOriginal}).`,
        category: "CEDEAR",
        provider: {
          "@type": "Organization",
          name: "BYMA",
        },
        identifier: base.Cedears,
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
  const base = await getCedearBaseByTicker(ticker)

  if (!base) {
    notFound()
  }

  const [history, faqs, profile, news] = await Promise.all([
    getCedearHistorical(base.Cedears),
    Promise.resolve(buildCedearFaqs(base)),
    getUnderlyingProfile(base.TickerOriginal),
    getCompanyNews(base.TickerOriginal),
  ])

  return (
    <>
      <CedearJsonLd base={base} faqs={faqs} />
      <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-16">
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
              <li className="font-medium text-foreground">{base.Cedears}</li>
            </ol>
          </nav>
          <div className="flex items-start gap-4">
            <img
              src={logoUrl(base.TickerOriginal)}
              alt=""
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-md bg-muted object-contain"
            />
            <div className="min-w-0">
              <h1 className="font-mono text-3xl font-semibold tracking-tight md:text-4xl">
                CEDEAR {base.Cedears}
              </h1>
              <p className="mt-1 text-lg text-muted-foreground">{base.Name}</p>
            </div>
          </div>
          <Alert variant="callout">
            <InfoIcon />
            <AlertDescription>
              Sí, existe CEDEAR de {base.TickerOriginal} en Argentina. Operás
              bajo el ticker {base.Cedears} en BYMA, con ratio {base.Ratio}:1
              respecto a la acción en {base.Market}.
            </AlertDescription>
          </Alert>
        </header>

        {profile ? (
          <section
            aria-labelledby="empresa-heading"
            className="rounded-lg border bg-card p-6"
          >
            <h2 id="empresa-heading" className="text-xl font-semibold tracking-tight">
              Empresa subyacente
            </h2>
            <div className="mt-4">
              <CedearCompanyProfile profile={profile} showHeading={false} />
            </div>
          </section>
        ) : null}

        <section
          aria-labelledby="historico-heading"
          className="rounded-lg border bg-card p-6"
        >
          <h2 id="historico-heading" className="mb-4 text-xl font-semibold tracking-tight">
            Precio histórico
          </h2>
          <CedearPriceChart ticker={base.Cedears} history={history} />
        </section>

        <section
          aria-labelledby="cotizacion-heading"
          className="rounded-lg border bg-card p-6"
        >
          <h2 id="cotizacion-heading" className="text-xl font-semibold tracking-tight">
            Cotización y datos
          </h2>
          <CedearDetailLive base={base} />
        </section>

        <CedearFaqs faqs={faqs} />

        <CedearNews items={news} tickerOriginal={base.TickerOriginal} />

        <SiteFooter>
          <Link href="/" className={footerLinkClassName}>
            Volver al listado completo
          </Link>
          {" · "}
          Datos de{" "}
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
