import type { Metadata } from "next"
import { EarningsTimelineView } from "@/components/earnings-timeline"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getEarningsTimeline } from "@/lib/earnings"
import { buildPageOpenGraph } from "@/lib/site"
import { CalendarIcon } from "lucide-react"

const title = "Calendario de earnings de CEDEARs"
const description =
  "Timeline de los próximos 3 meses con fechas de earnings calls de empresas que tienen CEDEAR en Argentina."

export const revalidate = 21600

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/earnings",
  },
  openGraph: buildPageOpenGraph({ title, description, url: "/earnings" }),
}

export default async function EarningsPage() {
  let content

  try {
    const timeline = await getEarningsTimeline()

    if (timeline.days.length === 0) {
      content = (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarIcon />
            </EmptyMedia>
            <EmptyTitle>Sin earnings programados</EmptyTitle>
            <EmptyDescription>
              No hay CEDEARs con earnings en los próximos 3 meses.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    } else {
      content = <EarningsTimelineView timeline={timeline} />
    }
  } catch {
    content = (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar los datos</AlertTitle>
        <AlertDescription>
          No se pudo obtener el calendario de earnings. Intentá recargar la página en
          unos minutos.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-16">
      <header className="flex flex-col gap-4">
        <SiteNav currentPath="/earnings" />
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
      </header>

      {content}

      <SiteFooter>
        Calendario de earnings de{" "}
        <a
          href="https://earningshub.com"
          target="_blank"
          rel="noopener noreferrer"
          className={footerLinkClassName}
        >
          EarningsHub
        </a>{" "}
        (SavvyTrader). Listado de CEDEARs provisto por{" "}
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
