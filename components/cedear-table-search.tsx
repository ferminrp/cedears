"use client"

import { SearchIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Input } from "@/components/ui/input"

type CedearTableSearchProps = {
  id: string
  query: string
  onQueryChange: (value: string) => void
  resultsLabel: string
  /** Optional filters (e.g. frequency ToggleGroup) between search and counter. */
  filters?: ReactNode
}

export function CedearTableSearch({
  id,
  query,
  onQueryChange,
  resultsLabel,
  filters,
}: CedearTableSearchProps) {
  return (
    <div className="sticky top-0 z-10 -mx-[var(--space-l)] border-b border-border bg-background px-[var(--space-l)] py-3 md:static md:mx-0 md:border-0 md:px-0 md:py-0">
      <label htmlFor={id} className="sr-only">
        Buscar CEDEAR
      </label>
      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={id}
          type="search"
          role="searchbox"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Ticker, empresa o subyacente"
          className="pl-9"
          autoComplete="off"
        />
      </div>
      {filters ? <div className="mt-3">{filters}</div> : null}
      <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
        {resultsLabel}
      </p>
    </div>
  )
}
