"use client"

import { useMemo } from "react"
import { PortfolioView } from "@/components/portfolio-view"
import { Skeleton } from "@/components/ui/skeleton"
import {
  mergeCedearsWithQuotes,
  useCedearQuotes,
} from "@/hooks/use-cedear-quotes"
import { summarizeImplicitDollar } from "@/lib/implicit-dollar"
import type { CedearBase } from "@/lib/merge-cedear-quotes"

export function PortfolioLive({ bases }: { bases: CedearBase[] }) {
  const { quotes, loading } = useCedearQuotes()
  const cedears = useMemo(
    () => mergeCedearsWithQuotes(bases, quotes),
    [bases, quotes],
  )
  const mep = useMemo(() => summarizeImplicitDollar(cedears, "mep"), [cedears])
  const cable = useMemo(
    () => summarizeImplicitDollar(cedears, "cable"),
    [cedears],
  )

  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Cargando cotizaciones"
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-10 w-full max-w-xs rounded-md" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <PortfolioView
      cedears={cedears}
      mepAverage={mep.average}
      cableAverage={cable.average}
      mepCount={mep.count}
      mepOutlierCount={mep.outlierCount}
      cableCount={cable.count}
      cableOutlierCount={cable.outlierCount}
    />
  )
}
