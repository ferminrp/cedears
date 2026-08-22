import type { Metadata } from "next"
import { SiteLink } from "@/components/site-link"
import { InfoIcon } from "lucide-react"

import { AlycsList } from "@/components/alycs-list"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAlycs } from "@/lib/alycs"
import { buildPageOpenGraph } from "@/lib/site"

const title = "ALyCs y comisiones para operar CEDEARs"
const description =
  "Compará comisiones de brokers argentinos (ALyCs) para operar CEDEARs como persona física, con enlaces al tarifario oficial de cada uno."

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/alycs",
  },
  openGraph: buildPageOpenGraph({ title, description, url: "/alycs" }),
}

export default function AlycsPage() {
  return (
    <>
      <header className="flex flex-col gap-4">
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          ALyCs para operar CEDEARs
        </h1>
        <p className="text-muted-foreground text-pretty">
          Comisiones publicadas para personas físicas. Compará brokers y abrí el
          tarifario oficial de cada uno.
        </p>
      </header>

      <Alert variant="callout">
        <InfoIcon />
        <AlertDescription>
          Todas las comisiones publicadas son <strong>+ IVA</strong>. Los valores
          mostrados corresponden a <strong>personas físicas</strong>.
        </AlertDescription>
      </Alert>

      <AlycsList alycs={getAlycs()} />

      <SiteFooter>
        <p>
          Las tarifas pueden cambiar sin previo aviso. Siempre verificá el tarifario
          oficial del broker antes de operar.
        </p>
        <p className="mt-2">
          <SiteLink href="/" className={footerLinkClassName}>
            Volver al listado completo
          </SiteLink>
          .
        </p>
      </SiteFooter>
    </>
  )
}
