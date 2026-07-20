import { getCedears } from "@/lib/cedears"
import { CedearsList } from "@/components/cedears-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function Page() {
  let content

  try {
    const cedears = await getCedears()
    content = <CedearsList cedears={cedears} />
  } catch {
    content = (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar los datos</AlertTitle>
        <AlertDescription>
          No se pudo obtener la lista de CEDEARs. Intentá recargar la página en unos
          minutos.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          CEDEARs disponibles en Argentina
        </h1>
        <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          Listado de Certificados de Depósito Argentinos con su empresa, mercado de
          origen y ratio de conversión. Buscá por ticker o nombre y filtrá por mercado.
        </p>
      </header>

      {content}

      <footer className="mt-auto border-t pt-6 text-sm text-muted-foreground">
        Datos provistos por{" "}
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
