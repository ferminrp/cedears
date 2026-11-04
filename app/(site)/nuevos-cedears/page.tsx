import type { Metadata } from "next"
import Link from "next/link"
import { CedearFaqs } from "@/components/cedear-faqs"
import { NuevosCedearsList } from "@/components/nuevos-cedears-list"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import { absoluteCanonical } from "@/lib/canonical"
import {
  NUEVOS_CEDEARS_ALTA_INTRO,
  NUEVOS_CEDEARS_DESCRIPTION,
  NUEVOS_CEDEARS_FAQ,
  NUEVOS_CEDEARS_INFERRED_NOTE,
  NUEVOS_CEDEARS_LEAD,
  NUEVOS_CEDEARS_METADATA_TITLE,
  NUEVOS_CEDEARS_PAGE_H1,
  buildNuevosCedearsPageModel,
  formatDetectedSince,
} from "@/lib/nuevos-cedears"
import { buildPageOpenGraph, getSiteUrl } from "@/lib/site"

export const revalidate = 86400

export async function generateMetadata(): Promise<Metadata> {
  const title = NUEVOS_CEDEARS_METADATA_TITLE
  return {
    title: { absolute: title },
    description: NUEVOS_CEDEARS_DESCRIPTION,
    alternates: {
      canonical: absoluteCanonical("/nuevos-cedears"),
    },
    openGraph: buildPageOpenGraph({
      title,
      description: NUEVOS_CEDEARS_DESCRIPTION,
      url: "/nuevos-cedears",
    }),
  }
}

function NuevosCedearsJsonLd({
  tickers,
}: {
  tickers: { ticker: string; name: string }[]
}) {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/nuevos-cedears`

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Nuevos CEDEARs",
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#list`,
        name: NUEVOS_CEDEARS_PAGE_H1,
        itemListElement: tickers.slice(0, 20).map((row, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: row.name ? `${row.ticker} — ${row.name}` : row.ticker,
          url: `${siteUrl}/cedear/${row.ticker}`,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: NUEVOS_CEDEARS_FAQ.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
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

export default function NuevosCedearsPage() {
  const model = buildNuevosCedearsPageModel()
  const referenceTime = model.referenceDate.getTime()

  return (
    <>
      <NuevosCedearsJsonLd tickers={model.qualifiedRows} />
      <header className="flex flex-col gap-3">
        <nav
          aria-label="Migas de pan"
          className="text-xs text-foreground/70"
        >
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center hover:text-foreground"
              >
                Inicio
              </Link>
            </li>
            <li aria-hidden className="px-0.5">
              /
            </li>
            <li>
              <span
                className="inline-flex min-h-11 items-center font-medium text-foreground"
                aria-current="page"
              >
                Nuevos CEDEARs
              </span>
            </li>
          </ol>
        </nav>
        <h1 className="text-balance text-[length:var(--size-xl)] leading-[var(--line-xl)] font-semibold tracking-[var(--letter-spacing-xl)] md:text-[length:var(--size-xxl)] md:leading-[var(--line-xxl)]">
          {NUEVOS_CEDEARS_PAGE_H1}
        </h1>
        <p className="max-w-[60ch] text-pretty text-muted-foreground">
          {NUEVOS_CEDEARS_LEAD}
        </p>
        <p className="max-w-[60ch] text-pretty text-sm leading-relaxed text-muted-foreground">
          {NUEVOS_CEDEARS_ALTA_INTRO}{" "}
          <Link
            href="/alycs"
            className="text-foreground underline underline-offset-4"
          >
            Cómo comprar CEDEARs
          </Link>{" "}
          y la{" "}
          <Link
            href="/ratios"
            className="text-foreground underline underline-offset-4"
          >
            tabla de ratios
          </Link>
          .
        </p>
        <p className="min-h-4 text-xs tabular-nums text-foreground/70">
          {model.count6Months}{" "}
          {model.count6Months === 1 ? "alta" : "altas"} en los últimos 6
          meses · Actualizado{" "}
          <time dateTime={model.updatedIsoDay}>
            {formatDetectedSince(model.updatedIsoDay)}
          </time>
        </p>
      </header>

      <p className="mt-4 max-w-[60ch] text-xs leading-relaxed text-foreground/70">
        {NUEVOS_CEDEARS_INFERRED_NOTE}
      </p>

      <NuevosCedearsList
        groups={model.groups}
        expandedGroups={model.expandedGroups}
        olderGroups={model.olderGroups}
        archiveCount={model.archiveCount}
        referenceTime={referenceTime}
      />

      <div className="mt-10">
        <CedearFaqs faqs={[...NUEVOS_CEDEARS_FAQ]} />
      </div>

      <p className="mt-8 text-xs text-foreground/70">
        <Link
          href="/categorias"
          className="inline-flex min-h-11 items-center font-medium text-foreground underline-offset-4 hover:underline"
        >
          Categorías
        </Link>
        {" · "}
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-medium text-foreground underline-offset-4 hover:underline"
        >
          Listado completo
        </Link>
      </p>

      <SiteFooter>
        Datos del listado en{" "}
        <a
          href="https://github.com/ferminrp/google-sheets-argento"
          target="_blank"
          rel="noopener noreferrer"
          className={`${footerLinkClassName} inline-flex min-h-11 items-center`}
        >
          google-sheets-argento
        </a>
        .
      </SiteFooter>
    </>
  )
}
