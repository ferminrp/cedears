import type { Metadata } from "next"
import Link from "next/link"
import { CalendarClockIcon, ScaleIcon } from "lucide-react"

import { SiteNav } from "@/components/site-nav"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import { buildPageOpenGraph } from "@/lib/site"

const title = "Herramientas para invertir en CEDEARs"
const description =
  "Calculadoras para gestionar tu cartera de CEDEARs: rebalanceo de portfolio con donut chart y órdenes de compra/venta, y planificador de DCA con detección de vueltos y desvíos."

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/herramientas",
  },
  openGraph: buildPageOpenGraph({ title, description, url: "/herramientas" }),
}

const tools = [
  {
    href: "/herramientas/rebalanceo",
    icon: ScaleIcon,
    name: "Calculadora de rebalanceo",
    description:
      "Ingresá tus nominales, mirá la composición actual en un donut chart y calculá qué comprar y vender para llegar a tu cartera objetivo.",
  },
  {
    href: "/herramientas/dca",
    icon: CalendarClockIcon,
    name: "Calculadora de DCA",
    description:
      "Definí cuánto invertís por mes y en qué porcentajes: te decimos cuántos nominales comprar de cada CEDEAR y cuánto vuelto o desvío queda.",
  },
] as const

export default function HerramientasPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-16">
      <header className="flex flex-col gap-4">
        <SiteNav currentPath="/herramientas" />
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Herramientas
        </h1>
        <p className="text-muted-foreground text-pretty">
          Calculadoras gratuitas para armar y mantener tu cartera de CEDEARs.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="flex h-full flex-col gap-3 rounded-lg border bg-card p-5 transition-colors hover:border-foreground/30 hover:bg-muted/50"
            >
              <span className="flex size-10 items-center justify-center rounded-md bg-muted">
                <tool.icon className="size-5" />
              </span>
              <span className="text-lg font-semibold tracking-tight">{tool.name}</span>
              <span className="text-sm text-muted-foreground text-pretty">
                {tool.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <SiteFooter>
        <Link href="/" className={footerLinkClassName}>
          Volver al listado completo
        </Link>
        {" · "}
        Datos de{" "}
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
