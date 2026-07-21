import type { Metadata } from "next"
import Link from "next/link"

import { DcaCalculator } from "@/components/dca-calculator"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getCedears } from "@/lib/get-cedears"
import { buildPageOpenGraph } from "@/lib/site"

const title = "Calculadora de DCA para CEDEARs"
const description =
  "Definí cuánta plata invertís por mes y en qué porcentajes: la calculadora te dice cuántos nominales comprar de cada CEDEAR y detecta vueltos y desvíos entre lo deseado y lo posible."

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/herramientas/dca",
  },
  openGraph: buildPageOpenGraph({
    title,
    description,
    url: "/herramientas/dca",
  }),
}

export default async function DcaPage() {
  let content

  try {
    const cedears = await getCedears()
    content = <DcaCalculator cedears={cedears} />
  } catch {
    content = (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar los datos</AlertTitle>
        <AlertDescription>
          No se pudieron obtener los precios de los CEDEARs. Intentá recargar la
          página en unos minutos.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-16">
      <header className="flex flex-col gap-4">
        <SiteNav currentPath="/herramientas" />
        <div className="flex flex-col gap-2">
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Calculadora de DCA
          </h1>
          <p className="text-muted-foreground text-pretty">
            Dollar-Cost Averaging: definí tu inversión mensual y su distribución,
            y calculá cuántos nominales comprar de cada CEDEAR.
          </p>
        </div>
      </header>

      {content}

      <SiteFooter>
        <Link href="/herramientas" className={footerLinkClassName}>
          Ver todas las herramientas
        </Link>
        {" · "}
        Precios en vivo de{" "}
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
  )
}
