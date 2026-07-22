"use client"

import { useMemo } from "react"
import { DcaCalculator } from "@/components/dca-calculator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  mergeCedearsWithQuotes,
  useCedearQuotes,
} from "@/hooks/use-cedear-quotes"
import type { CedearBase } from "@/lib/merge-cedear-quotes"

export function DcaLive({ bases }: { bases: CedearBase[] }) {
  const { quotes, loading } = useCedearQuotes()
  const cedears = useMemo(
    () => mergeCedearsWithQuotes(bases, quotes),
    [bases, quotes],
  )

  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Cargando cotizaciones"
        className="flex flex-col gap-6"
      >
        <Skeleton className="h-10 w-full max-w-xs rounded-md" />
        <Skeleton className="h-10 w-full max-w-sm rounded-md" />
        <p className="text-sm text-muted-foreground">
          Cargando cotizaciones para calcular la compra mensual…
        </p>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  return <DcaCalculator cedears={cedears} />
}
