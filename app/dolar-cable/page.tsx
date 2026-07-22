import type { Metadata } from "next"
import { ImplicitDollarLive } from "@/components/implicit-dollar-live"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getCedearBases } from "@/lib/get-cedears"
import { buildPageOpenGraph } from "@/lib/site"

const title = "Dólar cable implícito en CEDEARs"
const description =
  "Cotización promedio del dólar cable (CCL) implícita en CEDEARs, calculada sin outliers, con tabla y gráfico de dispersión."

export const revalidate = 3600

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/dolar-cable",
  },
  openGraph: buildPageOpenGraph({ title, description, url: "/dolar-cable" }),
}

export default async function DolarCablePage() {
  let content

  try {
    const bases = await getCedearBases()
    content = (
      <ImplicitDollarLive
        bases={bases}
        kind="cable"
        title="CEDEARs por dólar cable implícito"
        description="Dólar cable implícito promedio (sin outliers)"
      />
    )
  } catch {
    content = (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar los datos</AlertTitle>
        <AlertDescription>
          No se pudo obtener la cotización del dólar cable. Intentá recargar la página en
          unos minutos.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-16">
      <header className="flex flex-col gap-4">
        <SiteNav currentPath="/dolar-cable" />
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
