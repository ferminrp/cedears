import type { Metadata } from "next"
import Link from "next/link"
import { RatioConversionCalculator } from "@/components/ratio-conversion-calculator"
import { RatiosTable } from "@/components/ratios-table"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getCedears, getCedearsLivePricesFetchedAt } from "@/lib/get-cedears"
import { summarizeImplicitDollar } from "@/lib/implicit-dollar"
import {
  formatRatiosDataDate,
  RATIOS_PAGE_H1,
  ratiosMetadataTitle,
} from "@/lib/ratios"
import { buildPageOpenGraph, getSiteUrl } from "@/lib/site"

export const revalidate = 300

const description =
  "Tabla completa de ratios de conversión de CEDEARs con precios en vivo y calculadora CEDEARs ↔ acciones."

export async function generateMetadata(): Promise<Metadata> {
  const fetchedAt = await getCedearsLivePricesFetchedAt()
  const title = ratiosMetadataTitle(fetchedAt)
  return {
    title,
    description,
    alternates: {
      canonical: "/ratios",
    },
    openGraph: buildPageOpenGraph({ title, description, url: "/ratios" }),
  }
}

function RatiosJsonLd({
  count,
  dateModifiedIso,
}: {
  count: number
  dateModifiedIso: string | null
}) {
  const siteUrl = getSiteUrl()
  const csvUrl = `${siteUrl}/ratios.csv`

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Dataset",
        "@id": `${siteUrl}/ratios#dataset`,
        name: "Ratios de conversión de CEDEARs en Argentina",
        description,
        inLanguage: "es-AR",
        ...(dateModifiedIso ? { dateModified: dateModifiedIso } : {}),
        ...(count > 0 ? { size: count } : {}),
        distribution: {
          "@type": "DataDownload",
          encodingFormat: "text/csv",
          contentUrl: csvUrl,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "¿Qué es el ratio de un CEDEAR?",
            acceptedAnswer: {
              "@type": "Answer",
              text:
                "El ratio indica cuántos CEDEARs equivalen a una acción del activo subyacente en el mercado de origen. Por ejemplo, un ratio 10:1 significa que diez CEDEARs representan una acción.",
            },
          },
        ],
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

export default async function RatiosPage() {
  try {
    const [cedears, fetchedAt] = await Promise.all([
      getCedears(),
      getCedearsLivePricesFetchedAt(),
    ])
    const dateModifiedIso = fetchedAt?.toISOString() ?? null
    const cable = summarizeImplicitDollar(cedears, "cable")

    return (
      <>
        <RatiosJsonLd count={cedears.length} dateModifiedIso={dateModifiedIso} />
        <header className="flex flex-col gap-3">
          <h1 className="text-balance text-[length:var(--size-xl)] leading-[var(--line-xl)] font-semibold tracking-[var(--letter-spacing-xl)] md:text-[length:var(--size-xxl)] md:leading-[var(--line-xxl)]">
            {RATIOS_PAGE_H1}
          </h1>
          <p className="text-muted-foreground text-pretty">
            El ratio indica cuántos CEDEARs equivalen a una acción del subyacente.
          </p>
          {fetchedAt ? (
            <p className="text-sm text-muted-foreground">
              Precios actualizados el{" "}
              <time dateTime={dateModifiedIso ?? undefined}>
                {formatRatiosDataDate(fetchedAt)}
              </time>
              .
            </p>
          ) : null}
        </header>

        <div className="flex flex-col gap-10">
          {cable.count === 0 ? (
            <Alert>
              <AlertTitle>Sin cotización CCL</AlertTitle>
              <AlertDescription>
                No hay CCL implícito disponible para la calculadora teórica. La
                tabla de ratios sigue disponible.
              </AlertDescription>
            </Alert>
          ) : null}

          <section
            aria-labelledby="ratios-table-heading"
            className="flex min-w-0 flex-col gap-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2
                id="ratios-table-heading"
                className="text-base font-medium"
              >
                Todos los ratios
              </h2>
              <Link
                id="ratios-download-csv"
                href="/ratios.csv"
                download
                className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Descargar CSV
              </Link>
            </div>
            <RatiosTable cedears={cedears} />
          </section>

          <section
            aria-labelledby="ratio-calculator-heading"
            className="flex flex-col gap-4"
          >
            <h2 id="ratio-calculator-heading" className="text-base font-medium">
              Calculadora de conversión
            </h2>
            <RatioConversionCalculator
              cedears={cedears}
              cclAverage={cable.average}
              cclAvailable={cable.count > 0}
            />
          </section>
        </div>

        <SiteFooter>
          Ratios de{" "}
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
          .{" "}
          <Link href="/dividendos" className={footerLinkClassName}>
            Dividendos de CEDEARs
          </Link>
          .
        </SiteFooter>
      </>
    )
  } catch {
    return (
      <>
        <header className="flex flex-col gap-4">
          <h1 className="text-balance text-[length:var(--size-xl)] leading-[var(--line-xl)] font-semibold tracking-[var(--letter-spacing-xl)] md:text-[length:var(--size-xxl)] md:leading-[var(--line-xxl)]">
            {RATIOS_PAGE_H1}
          </h1>
        </header>
        <Alert variant="destructive">
          <AlertTitle>Error al cargar los datos</AlertTitle>
          <AlertDescription>
            No se pudo obtener la lista de CEDEARs. Intentá recargar la página en unos
            minutos.
          </AlertDescription>
        </Alert>
        <SiteFooter>
          <Link href="/" className={footerLinkClassName}>
            Volver al listado completo
          </Link>
        </SiteFooter>
      </>
    )
  }
}
