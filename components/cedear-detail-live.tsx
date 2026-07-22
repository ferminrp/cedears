"use client"

import { useMemo } from "react"
import { CedearDetailView } from "@/components/cedear-detail-view"
import {
  mergeCedearsWithQuotes,
  useCedearQuotes,
} from "@/hooks/use-cedear-quotes"
import type { CedearBase } from "@/lib/merge-cedear-quotes"

export function CedearDetailLive({ base }: { base: CedearBase }) {
  const { quotes, loading } = useCedearQuotes()
  const cedear = useMemo(
    () => mergeCedearsWithQuotes([base], quotes)[0],
    [base, quotes],
  )

  return (
    <div aria-busy={loading || undefined}>
      <CedearDetailView cedear={cedear} />
    </div>
  )
}
