import type { Metadata } from "next"
import Link from "next/link"

import { RebalanceCalculator } from "@/components/rebalance-calculator"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getBonds } from "@/lib/get-bonds"
import { getCedears } from "@/lib/get-cedears"
import { buildPageOpenGraph } from "@/lib/site"

const title = "Calculadora de rebalanceo de CEDEARs"
const description =
  "Ingresá tus nominales de cada CEDEAR o bono argentino, visualizá la composición actual de tu cartera en un donut chart y calculá las operaciones para llegar a tu distribución objetivo: comprando y vendiendo, o solo comprando con un aporte nuevo."

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
    // Los bonos son opcionales: si data912 falla, la calculadora sigue
    // funcionando solo con CEDEARs.
    const [cedears, bonds] = await Promise.all([
      getCedears(),
      getBonds().catch((error) => {
        console.error("No se pudieron cargar los bonos", error)
        return []
      }),
    ])
    content = <RebalanceCalculator cedears={cedears} bonds={bonds} />
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
    <>
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Calculadora de rebalanceo
          </h1>
          <p className="text-muted-foreground text-pretty">
            Cargá cuántos nominales tenés de cada CEDEAR o bono argentino, definí tu composición
            objetivo y obtené las operaciones para rebalancear: con compras y
            ventas, o solo con compras invirtiendo dinero nuevo.
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
    </>
  )
}
