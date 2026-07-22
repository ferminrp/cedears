"use client"

import { useMemo } from "react"
import { ImplicitDollarView } from "@/components/implicit-dollar-view"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  mergeCedearsWithQuotes,
  useCedearQuotes,
} from "@/hooks/use-cedear-quotes"
import {
  summarizeImplicitDollar,
  type DollarKind,
} from "@/lib/implicit-dollar"
import type { CedearBase } from "@/lib/merge-cedear-quotes"

const emptyAlerts: Record<DollarKind, { title: string; description: string }> =
  {
    mep: {
      title: "Sin datos de MEP",
      description:
        "Ningún CEDEAR tiene cotización MEP implícita disponible en este momento.",
    },
    cable: {
      title: "Sin datos de cable",
      description:
        "Ningún CEDEAR tiene cotización cable implícita disponible en este momento.",
    },
  }

export function ImplicitDollarLive({
  bases,
  kind,
  title,
  description,
}: {
  bases: CedearBase[]
  kind: DollarKind
  title: string
  description: string
}) {
  const { quotes, loading } = useCedearQuotes()
  const cedears = useMemo(
    () => mergeCedearsWithQuotes(bases, quotes),
    [bases, quotes],
  )
  const summary = useMemo(
    () => summarizeImplicitDollar(cedears, kind),
    [cedears, kind],
  )

  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Cargando cotizaciones"
        className="flex flex-col gap-8"
      >
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-[280px] w-full rounded-md" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (summary.count === 0) {
    const alert = emptyAlerts[kind]
    return (
      <Alert>
        <AlertTitle>{alert.title}</AlertTitle>
        <AlertDescription>{alert.description}</AlertDescription>
      </Alert>
    )
  }

  return (
    <ImplicitDollarView
      title={title}
      description={description}
      summary={summary}
    />
  )
}
