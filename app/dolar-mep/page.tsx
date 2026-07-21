import type { Metadata } from "next"
import { ImplicitDollarView } from "@/components/implicit-dollar-view"
import { SiteNav } from "@/components/site-nav"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getCedears } from "@/lib/get-cedears"
import { summarizeImplicitDollar } from "@/lib/implicit-dollar"
import { buildPageOpenGraph } from "@/lib/site"

const title = "Dólar MEP implícito en CEDEARs"
const description =
  "Cotización promedio del dólar MEP implícita en CEDEARs, calculada sin outliers, con tabla y gráfico de dispersión."

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/dolar-mep",
  },
  openGraph: buildPageOpenGraph({ title, description, url: "/dolar-mep" }),
}

export default async function DolarMepPage() {
  let content

  try {
    const cedears = await getCedears()
    const summary = summarizeImplicitDollar(cedears, "mep")

    if (summary.count === 0) {
      content = (
        <Alert>
          <AlertTitle>Sin datos de MEP</AlertTitle>
          <AlertDescription>
            Ningún CEDEAR tiene cotización MEP implícita disponible en este momento.
          </AlertDescription>
        </Alert>
      )
    } else {
      content = (
        <ImplicitDollarView
          title="CEDEARs por dólar MEP implícito"
          description="Dólar MEP implícito promedio (sin outliers)"
          summary={summary}
        />
      )
    }
  } catch {
    content = (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar los datos</AlertTitle>
        <AlertDescription>
          No se pudo obtener la cotización del dólar MEP. Intentá recargar la página en
          unos minutos.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-16">
      <header className="flex flex-col gap-4">
        <SiteNav currentPath="/dolar-mep" />
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
      </header>

      {content}

      <footer className="mt-auto border-t pt-6 text-sm text-muted-foreground">
        Precios en vivo de{" "}
        <a
          href="https://data912.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-4"
        >
          data912
        </a>
        . Listado de CEDEARs provisto por{" "}
        <a
          href="https://github.com/ferminrp/google-sheets-argento"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-4"
        >
          google-sheets-argento
        </a>
        .
      </footer>
    </main>
  )
}
