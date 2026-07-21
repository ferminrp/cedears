import type { Metadata } from "next"
import { PortfolioView } from "@/components/portfolio-view"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getCedears } from "@/lib/get-cedears"
import { summarizeImplicitDollar } from "@/lib/implicit-dollar"
import { buildPageOpenGraph } from "@/lib/site"

const title = "Portfolio de CEDEARs"
const description =
  "Seguí tus nominales de CEDEARs y valuá tu portfolio en pesos, dólar MEP y dólar cable con el promedio implícito sin outliers."

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/portfolio",
  },
  openGraph: buildPageOpenGraph({ title, description, url: "/portfolio" }),
}

export default async function PortfolioPage() {
  let content

  try {
    const cedears = await getCedears()
    const mep = summarizeImplicitDollar(cedears, "mep")
    const cable = summarizeImplicitDollar(cedears, "cable")

    content = (
      <PortfolioView
        cedears={cedears}
        mepAverage={mep.average}
        cableAverage={cable.average}
        mepCount={mep.count}
        mepOutlierCount={mep.outlierCount}
        cableCount={cable.count}
        cableOutlierCount={cable.outlierCount}
      />
    )
  } catch {
    content = (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar los datos</AlertTitle>
        <AlertDescription>
          No se pudo obtener la información del portfolio. Intentá recargar la página en
          unos minutos.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-16">
      <header className="flex flex-col gap-4">
        <SiteNav currentPath="/portfolio" />
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
      </header>

      {content}

      <SiteFooter>
        Precios en vivo de{" "}
        <a
          href="https://data912.com"
          target="_blank"
          rel="noopener noreferrer"
          className={footerLinkClassName}
        >
          data912
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
    </main>
  )
}
