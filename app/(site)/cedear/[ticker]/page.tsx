import type { Metadata } from "next"
import Link from "next/link"
import { InfoIcon } from "lucide-react"
import { notFound } from "next/navigation"
import { CedearCompanyProfile } from "@/components/cedear-company-profile"
import { CedearDetailView } from "@/components/cedear-detail-view"
import { CedearFaqs } from "@/components/cedear-faqs"
import { CedearNews } from "@/components/cedear-news"
import { CedearPriceChart } from "@/components/cedear-price-chart"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CedearSimilar } from "@/components/cedear-similar"
import {
  buildCedearDetailTitle,
  cedearCompanyLabel,
} from "@/lib/cedear-display"
import { buildCedearFaqs } from "@/lib/cedear-faqs"
import { categoryPath } from "@/lib/cedear-tags"
import { formatArs } from "@/lib/cedears"
import { getCompanyNews } from "@/lib/company-news"
import {
  getCedearBases,
  getCedearByTicker,
  getCedears,
} from "@/lib/get-cedears"
import {
  getPrimaryCedearTag,
  getSimilarCedears,
} from "@/lib/similar-cedears"
import { cedearYahooSymbol } from "@/lib/cedear-yahoo"
import { getUnderlyingPaysDividends } from "@/lib/underlying-dividends"
import { getCedearHistorical } from "@/lib/historical"
import { getUnderlyingProfile } from "@/lib/underlying-profile"
import { logoUrl } from "@/lib/logo"
import { absoluteCanonical } from "@/lib/canonical"
import { getSiteUrl, buildPageOpenGraph } from "@/lib/site"

export const revalidate = 3600
export const dynamicParams = true

type PageProps = {
  params: Promise<{ ticker: string }>
}

export async function generateStaticParams() {
  const bases = await getCedearBases()
  const omitTicker = process.env.CEDEARS_OMIT_STATIC_TICKER?.trim().toUpperCase()
  return bases
    .filter(
      (cedear) =>
        !omitTicker || cedear.Cedears.trim().toUpperCase() !== omitTicker,
    )
    .map((cedear) => ({ ticker: cedear.Cedears }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ticker } = await params
  const cedear = await getCedearByTicker(ticker)

  if (!cedear) {
    notFound()
  }

  const paysDividends = await getUnderlyingPaysDividends(
    cedearYahooSymbol(cedear),
  )
  const title = buildCedearDetailTitle(cedear, paysDividends === true)
  const empresa = cedearCompanyLabel(cedear)
  const priceSnippet =
    cedear.price !== null ? ` Cotiza a ${formatArs(cedear.price)}.` : ""
  const description = `¿Existe CEDEAR de ${cedear.TickerOriginal}? Sí: ${cedear.Cedears} (${empresa}). Ratio ${cedear.Ratio}:1, precio, MEP, cable y gráfico histórico.${priceSnippet}`
  const canonical = absoluteCanonical(`/cedear/${cedear.Cedears}`)

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
    openGraph: buildPageOpenGraph({ title, description, url: canonical }),
  }
}

function CedearJsonLd({
  cedear,
  faqs,
  pageTitle,
  primaryTag,
}: {
  cedear: NonNullable<Awaited<ReturnType<typeof getCedearByTicker>>>
  faqs: ReturnType<typeof buildCedearFaqs>
  pageTitle: string
  primaryTag: string | null
}) {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/cedear/${cedear.Cedears}`
  const empresa = cedearCompanyLabel(cedear)

  const breadcrumbItems: {
    "@type": "ListItem"
    position: number
    name: string
    item?: string
  }[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Listado",
      item: `${siteUrl}/`,
    },
  ]

  if (primaryTag) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: breadcrumbItems.length + 1,
      name: primaryTag,
      item: `${siteUrl}${categoryPath(primaryTag)}`,
    })
  }

  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: cedear.Cedears,
    item: pageUrl,
  })

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: pageTitle,
        description: `Información del CEDEAR ${cedear.Cedears} (${empresa}) en Argentina.`,
        inLanguage: "es-AR",
        isPartOf: { "@id": `${siteUrl}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: breadcrumbItems,
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
  const cedear = await getCedearByTicker(ticker)

  if (!cedear) {
    notFound()
  }

  const primaryTag = getPrimaryCedearTag(cedear)

  const [history, faqs, profile, news, paysDividends, allCedears] =
    await Promise.all([
      getCedearHistorical(cedear.Cedears),
      Promise.resolve(buildCedearFaqs(cedear)),
      getUnderlyingProfile(cedear.TickerOriginal),
      getCompanyNews(cedear.TickerOriginal),
      getUnderlyingPaysDividends(cedearYahooSymbol(cedear)),
      getCedears(),
    ])

  const pageTitle = buildCedearDetailTitle(cedear, paysDividends === true)
  const empresaHeading = cedearCompanyLabel(cedear)
  const similarCedears = getSimilarCedears(cedear, allCedears)

  return (
    <>
      <CedearJsonLd
        cedear={cedear}
        faqs={faqs}
        pageTitle={pageTitle}
        primaryTag={primaryTag}
      />
      <header className="flex flex-col gap-4">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5 break-words">
            <li>
              <Link href="/" className="hover:text-foreground">
                Listado
              </Link>
            </li>
            {primaryTag ? (
              <>
                <li aria-hidden>/</li>
                <li>
                  <Link
                    href={categoryPath(primaryTag)}
                    className="hover:text-foreground"
                  >
                    {primaryTag}
                  </Link>
                </li>
              </>
            ) : null}
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
            <h1 className="text-balance break-words text-[length:var(--size-xl)] leading-[var(--line-xl)] font-semibold tracking-[var(--letter-spacing-xl)] md:text-[length:var(--size-xxl)] md:leading-[var(--line-xxl)]">
              {empresaHeading}
            </h1>
            <p className="mt-1 font-mono text-lg text-muted-foreground">
              {cedear.Cedears}
            </p>
          </div>
        </div>
        <Alert variant="callout">
          <InfoIcon />
          <AlertDescription>
            Sí, existe CEDEAR de {cedear.TickerOriginal} en Argentina. Operás
            bajo el ticker {cedear.Cedears} en BYMA, con ratio {cedear.Ratio}:1
            respecto a la acción en {cedear.Market}.
          </AlertDescription>
        </Alert>
      </header>

      {profile ? (
        <section
          aria-labelledby="empresa-heading"
          className="rounded-[var(--radius-m)] border border-border bg-card p-6"
        >
          <h2 id="empresa-heading" className="text-[length:var(--size-l)] leading-[var(--line-l)] font-semibold tracking-[var(--letter-spacing-l)]">
            Empresa subyacente
          </h2>
          <div className="mt-4">
            <CedearCompanyProfile profile={profile} showHeading={false} />
          </div>
        </section>
      ) : null}

      <section
        aria-labelledby="historico-heading"
        className="rounded-[var(--radius-m)] border border-border bg-card p-6"
      >
        <h2 id="historico-heading" className="mb-4 text-[length:var(--size-l)] leading-[var(--line-l)] font-semibold tracking-[var(--letter-spacing-l)]">
          Precio histórico
        </h2>
        <CedearPriceChart ticker={cedear.Cedears} history={history} />
      </section>

      <section
        aria-labelledby="cotizacion-heading"
        className="rounded-[var(--radius-m)] border border-border bg-card p-6"
      >
        <h2 id="cotizacion-heading" className="text-[length:var(--size-l)] leading-[var(--line-l)] font-semibold tracking-[var(--letter-spacing-l)]">
          Cotización y datos
        </h2>
        <CedearDetailView cedear={cedear} />
      </section>

      <CedearFaqs faqs={faqs} />

      {primaryTag ? (
        <CedearSimilar items={similarCedears} categoryTag={primaryTag} />
      ) : null}

      <CedearNews items={news} tickerOriginal={cedear.TickerOriginal} />

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
    </>
  )
}
