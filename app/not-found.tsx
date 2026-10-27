import Link from "next/link"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-[var(--space-xxl)] px-[var(--space-l)] py-[var(--space-xxl)] md:py-16">
      <header className="flex flex-col gap-4">
        <h1 className="text-[length:var(--size-xl)] font-semibold tracking-[var(--letter-spacing-xl)]">
          Página no encontrada
        </h1>
        <p className="text-muted-foreground">
          No hay contenido en esta URL. Volvé al listado o buscá un CEDEAR por
          ticker.
        </p>
      </header>
      <SiteFooter>
        <Link href="/" className={footerLinkClassName}>
          Ir al listado de CEDEARs
        </Link>
      </SiteFooter>
    </main>
  )
}
