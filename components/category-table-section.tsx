import Link from "next/link"
import { CedearsThemeTable } from "@/components/cedears-theme-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { isBymaRegularSessionOpen } from "@/lib/byma-hours"
import type { Cedear } from "@/lib/cedears"
import { getCedears } from "@/lib/get-cedears"

type CategoryTableSectionProps = {
  matchingTags: string[]
  canonicalSlug: string
}

export async function CategoryTableSection({
  matchingTags,
  canonicalSlug,
}: CategoryTableSectionProps) {
  try {
    const cedears = await getCedears()
    const quoteTime = new Date()
    const showPreviousCloseLabel = !isBymaRegularSessionOpen(quoteTime)
    const matchingTagSet = new Set(matchingTags)
    const filtered: Cedear[] = cedears
      .filter((c) => c.tags.some((t) => matchingTagSet.has(t)))
      .sort((a, b) => a.Cedears.localeCompare(b.Cedears))

    if (filtered.length === 0) {
      return (
        <Empty className="rounded-[var(--radius-m)] border border-border">
          <EmptyHeader>
            <EmptyTitle>Todavía no hay CEDEARs en esta categoría</EmptyTitle>
            <EmptyDescription>
              <Link href="/categorias" className="underline underline-offset-4">
                Ver todas las categorías
              </Link>
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    }

    return (
      <CedearsThemeTable
        cedears={filtered}
        hideUnderlying={canonicalSlug === "etfs"}
        showPreviousCloseLabel={showPreviousCloseLabel}
      />
    )
  } catch {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar los datos</AlertTitle>
        <AlertDescription>
          No se pudo obtener la lista de CEDEARs. Intentá recargar la página en unos
          minutos.
        </AlertDescription>
      </Alert>
    )
  }
}
