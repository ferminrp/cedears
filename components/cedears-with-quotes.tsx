"use client"

import { useMemo } from "react"
import { CedearsList } from "@/components/cedears-list"
import {
  mergeCedearsWithQuotes,
  useCedearQuotes,
} from "@/hooks/use-cedear-quotes"
import type { CedearBase } from "@/lib/merge-cedear-quotes"

export function CedearsWithQuotes({
  bases,
  initialTag,
}: {
  bases: CedearBase[]
  initialTag?: string
}) {
  const { quotes, loading } = useCedearQuotes()
  const cedears = useMemo(
    () => mergeCedearsWithQuotes(bases, quotes),
    [bases, quotes],
  )

  return (
    <CedearsList
      cedears={cedears}
      quotesLoading={loading}
      initialTag={initialTag}
    />
  )
}
