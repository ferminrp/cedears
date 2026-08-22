import { SiteLink } from "@/components/site-link"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import { siteConfig } from "@/lib/site"
import { notFoundMarkdownBody } from "@/lib/agent-routes"

export default function NotFoundContent() {
  const markdown = notFoundMarkdownBody()

  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Página no encontrada
        </h1>
        <p className="text-pretty text-sm text-muted-foreground">
          Esta URL no existe en {siteConfig.name} (cedears.com). Los agentes
          pueden seguir el mapa de abajo; las personas pueden volver al listado.
        </p>
      </header>

      <section
        aria-labelledby="agent-recovery"
        className="rounded-lg border bg-card p-4"
      >
        <h2 id="agent-recovery" className="mb-3 text-base font-medium">
          Dónde seguir
        </h2>
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">
          {markdown}
        </pre>
      </section>

      <SiteFooter>
        <SiteLink href="/" className={footerLinkClassName}>
          Volver al listado de CEDEARs
        </SiteLink>
      </SiteFooter>
    </>
  )
}
