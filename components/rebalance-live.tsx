"use client"

import { useMemo } from "react"
import { RebalanceCalculator } from "@/components/rebalance-calculator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  mergeCedearsWithQuotes,
  useCedearQuotes,
} from "@/hooks/use-cedear-quotes"
import type { CedearBase } from "@/lib/merge-cedear-quotes"

export function RebalanceLive({ bases }: { bases: CedearBase[] }) {
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
        <Skeleton className="h-10 w-full max-w-sm rounded-md" />
        <p className="text-sm text-muted-foreground">
          Cargando cotizaciones para calcular el rebalanceo…
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          <Skeleton className="h-56 rounded-lg" />
          <Skeleton className="h-56 rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  return <RebalanceCalculator cedears={cedears} />
}
