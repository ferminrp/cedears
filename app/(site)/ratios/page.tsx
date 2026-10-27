import type { Metadata } from "next"
import Link from "next/link"
import { DownloadIcon } from "lucide-react"
import { RatioConversionCalculator } from "@/components/ratio-conversion-calculator"
import { RatiosTable } from "@/components/ratios-table"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { getCedears, getCedearsLivePricesFetchedAt } from "@/lib/get-cedears"
import { summarizeImplicitDollar } from "@/lib/implicit-dollar"
import { cedearsWithArsPrice, formatRatiosDataDate, ratiosPageTitle } from "@/lib/ratios"
import { buildPageOpenGraph, getSiteUrl } from "@/lib/site"

export const revalidate = 300

const description =
  "Tabla de ratios de conversión de CEDEARs con precios en vivo, calculadora CEDEARs ↔ acciones y precio teórico al CCL implícito. Exportá CSV."

export async function generateMetadata(): Promise<Metadata> {
  const fetchedAt = await getCedearsLivePricesFetchedAt()
  const title = ratiosPageTitle(fetchedAt)
  return {
    title,
    description,
    alternates: {
      canonical: "/ratios",
    },
    openGraph: buildPageOpenGraph({ title, description, url: "/ratios" }),
  }
}

function RatiosJsonLd({ count, updated }: { count: number; updated: string }) {
  const siteUrl = getSiteUrl()
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: `${siteUrl}/ratios`,
    name: `Ratios de conversión de CEDEARs (actualizado ${updated})`,
    description,
    inLanguage: "es-AR",
    isPartOf: { "@id": `${siteUrl}/#website` },
    ...(count > 0 ? { about: { "@type": "Dataset", size: `${count} CEDEARs` } } : {}),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export default async function RatiosPage() {
  let content
  let heading = "Ratios de conversión de CEDEARs"
  let updatedLabel: string | null = null

  try {
    const [cedears, fetchedAt] = await Promise.all([
      getCedears(),
      getCedearsLivePricesFetchedAt(),
    ])
    heading = ratiosPageTitle(fetchedAt)
    updatedLabel = fetchedAt ? formatRatiosDataDate(fetchedAt) : null
    const pricedCedears = cedearsWithArsPrice(cedears)
    const cable = summarizeImplicitDollar(cedears, "cable")

    content = (
      <div className="flex flex-col gap-8">
        {cable.count === 0 ? (
          <Alert>
            <AlertTitle>Sin cotización CCL</AlertTitle>
            <AlertDescription>
              No hay CCL implícito disponible para la calculadora teórica. La tabla
              de ratios sigue disponible.
            </AlertDescription>
          </Alert>
        ) : null}
        <RatioConversionCalculator
          cedears={cedears}
          cclAverage={cable.average}
          cclAvailable={cable.count > 0}
        />
        <section aria-labelledby="ratios-table-heading" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="ratios-table-heading" className="text-base font-medium">
              Listado completo
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              nativeButton={false}
              render={
                <a href="/ratios.csv" download>
                  <DownloadIcon className="size-4" />
                  Descargar CSV
                </a>
              }
            />
          </div>
          <RatiosTable cedears={pricedCedears} />
        </section>
      </div>
    )

    return (
      <>
        <RatiosJsonLd
          count={pricedCedears.length}
          updated={updatedLabel ?? heading}
        />
        <header className="flex flex-col gap-4">
          <h1 className="text-balance text-[length:var(--size-xl)] leading-[var(--line-xl)] font-semibold tracking-[var(--letter-spacing-xl)] md:text-[length:var(--size-xxl)] md:leading-[var(--line-xxl)]">
            {heading}
          </h1>
          <p className="text-muted-foreground text-pretty">
            Consultá el ratio de cada CEDEAR respecto a su acción en el mercado de
            origen, con precio en pesos actualizado y exportación CSV.
          </p>
        </header>
        {content}
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
          . CCL implícito según{" "}
          <Link href="/dolar-cable" className={footerLinkClassName}>
            dólar cable
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
            {heading}
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
