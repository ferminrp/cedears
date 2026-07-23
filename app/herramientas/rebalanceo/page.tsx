import type { Metadata } from "next"
import Link from "next/link"

import { RebalanceCalculator } from "@/components/rebalance-calculator"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getCedears } from "@/lib/get-cedears"
import { buildPageOpenGraph } from "@/lib/site"

const title = "Calculadora de rebalanceo de CEDEARs"
const description =
  "Ingresá tus nominales de cada CEDEAR, visualizá la composición actual de tu cartera en un donut chart y calculá las operaciones de compra y venta para llegar a tu distribución objetivo."

export const revalidate = 300

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/herramientas/rebalanceo",
  },
  openGraph: buildPageOpenGraph({
    title,
    description,
    url: "/herramientas/rebalanceo",
  }),
}

export default async function RebalanceoPage() {
  let content

  try {
    const cedears = await getCedears()
    content = <RebalanceCalculator cedears={cedears} />
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
            Calculadora de rebalanceo
          </h1>
          <p className="text-muted-foreground text-pretty">
            Cargá cuántos nominales tenés de cada CEDEAR, definí tu composición
            objetivo y obtené las operaciones de compra y venta para rebalancear.
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
