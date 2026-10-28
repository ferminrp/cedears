import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { DividendsTable } from "@/components/dividends-table"
import { CedearFaqs } from "@/components/cedear-faqs"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { absoluteCanonical } from "@/lib/canonical"
import { formatDividendosUpdatedDate } from "@/lib/dividend-display"
import {
  DIVIDENDOS_FAQ,
  DIVIDENDOS_HOW_IT_WORKS,
  DIVIDENDOS_INTRO,
  DIVIDENDOS_META_DESCRIPTION,
  DIVIDENDOS_PAGE_H1,
  DIVIDENDOS_PAGE_TITLE,
  getDividendsTableData,
} from "@/lib/dividends"
import { buildPageOpenGraph, getSiteUrl } from "@/lib/site"
import { BanknoteIcon } from "lucide-react"

export const revalidate = 86400

type PageProps = {
  searchParams: Promise<{ frecuencia?: string }>
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams
  const filtered = Boolean(params.frecuencia?.trim())

  return {
    title: DIVIDENDOS_PAGE_TITLE,
    description: DIVIDENDOS_META_DESCRIPTION,
    keywords: [
      "dividendos cedears",
      "cedears que pagan dividendos",
      "calendario dividendos cedears",
    ],
    alternates: {
      canonical: absoluteCanonical("/dividendos"),
    },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: buildPageOpenGraph({
      title: DIVIDENDOS_PAGE_TITLE,
      description: DIVIDENDOS_META_DESCRIPTION,
      url: "/dividendos",
    }),
  }
}

function DividendosJsonLd({
  rows,
  asOfDate,
}: {
  rows: Awaited<ReturnType<typeof getDividendsTableData>>["rows"]
  asOfDate: string
}) {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/dividendos`
  const csvUrl = `${siteUrl}/dividendos.csv`

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Dataset",
        name: DIVIDENDOS_PAGE_H1,
        description: DIVIDENDOS_META_DESCRIPTION,
        inLanguage: "es-AR",
        dateModified: asOfDate,
        url: pageUrl,
        distribution: {
          "@type": "DataDownload",
          encodingFormat: "text/csv",
          contentUrl: csvUrl,
        },
      },
      {
        "@type": "ItemList",
        name: DIVIDENDOS_PAGE_H1,
        numberOfItems: rows.length,
        itemListElement: rows.slice(0, 50).map((row, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: row.name,
          url: `${siteUrl}/cedear/${encodeURIComponent(row.cedear)}`,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: DIVIDENDOS_FAQ.map((item) => ({
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

export default async function DividendosPage({ searchParams }: PageProps) {
  const params = await searchParams
  const initialFrequency = params.frecuencia?.trim() || "todas"
  const data = await getDividendsTableData()
  const updatedLabel = formatDividendosUpdatedDate(data.asOfDate)

  let tableSection
  if (data.loadFailed) {
    tableSection = (
      <Empty className="rounded-[var(--radius-m)] border border-border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BanknoteIcon />
          </EmptyMedia>
          <EmptyTitle>No pudimos cargar los dividendos</EmptyTitle>
          <EmptyDescription>Probá más tarde.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  } else if (data.rows.length === 0) {
    tableSection = (
      <Empty className="rounded-[var(--radius-m)] border border-border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BanknoteIcon />
          </EmptyMedia>
          <EmptyTitle>Sin datos de dividendos</EmptyTitle>
          <EmptyDescription>
            No hay CEDEARs con yield de dividendo positivo en este momento.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  } else {
    tableSection = (
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Cargando tabla…</p>
        }
      >
        <DividendsTable
          rows={data.rows}
          referenceDateIso={data.asOfDate}
          initialFrequency={initialFrequency}
        />
      </Suspense>
    )
  }

  return (
    <>
      <DividendosJsonLd rows={data.rows} asOfDate={data.asOfDate} />
      <header className="flex flex-col gap-3">
        <h1 className="text-balance text-[length:var(--size-xl)] leading-[var(--line-xl)] font-semibold tracking-[var(--letter-spacing-xl)] md:text-[length:var(--size-xxl)] md:leading-[var(--line-xxl)]">
          {DIVIDENDOS_PAGE_H1}
        </h1>
        <p className="text-pretty text-muted-foreground">{DIVIDENDOS_INTRO}</p>
        <p className="text-sm text-muted-foreground">
          Actualizado el{" "}
          <time dateTime={data.asOfDate}>{updatedLabel}</time>.
        </p>
      </header>

      <div className="flex flex-col gap-10">
        <section
          aria-labelledby="dividendos-table-heading"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 id="dividendos-table-heading" className="text-base font-medium">
              Próximos dividendos
            </h2>
            <Link
              href="/dividendos.csv"
              download
              className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Descargar CSV
            </Link>
          </div>
          {tableSection}
        </section>

        <section aria-labelledby="dividendos-how-heading" className="flex flex-col gap-3">
          <h2 id="dividendos-how-heading" className="text-base font-medium">
            Cómo se cobran en Argentina
          </h2>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            {DIVIDENDOS_HOW_IT_WORKS.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <CedearFaqs faqs={[...DIVIDENDOS_FAQ]} />
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Ver también:{" "}
        <Link href="/ratios" className="underline underline-offset-4">
          Ratios de CEDEARs
        </Link>
        .
      </p>

      <SiteFooter>
        Yield y calendario vía{" "}
        <a
          href="https://finance.yahoo.com"
          target="_blank"
          rel="noopener noreferrer"
          className={footerLinkClassName}
        >
          Yahoo Finance
        </a>
        . Listado de CEDEARs provisto por{" "}
        <a
          href="https://github.com/ferminrp/google-sheets-argento"
          target="_blank"
          rel="noopener noreferrer"
          className={footerLinkClassName}
        >
          google-sheets-argento
        </a>
        .
      </SiteFooter>
    </>
  )
}
