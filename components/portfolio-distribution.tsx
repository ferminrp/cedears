"use client"

import { useState } from "react"
import { ChevronDownIcon } from "lucide-react"
import {
  donutColor,
  formatPercent,
} from "@/lib/tools"
import { type PortfolioCompositionSegment } from "@/lib/portfolio"
import { cn } from "@/lib/utils"

function distributionLabel(segments: PortfolioCompositionSegment[]): string {
  return `Distribución: ${segments
    .map((segment) => `${segment.ticker} ${formatPercent(segment.pct)}`)
    .join(", ")}`
}

export function PortfolioDistribution({
  segments,
  variant = "card",
}: {
  segments: PortfolioCompositionSegment[]
  /**
   * "card": bordered panel with a disclosure legend (desktop).
   * "inline": just the compact stacked bar, for a summary that lists each
   * holding (with its colour swatch) right below it (mobile).
   */
  variant?: "card" | "inline"
}) {
  const [expanded, setExpanded] = useState(false)

  if (variant === "inline") {
    if (segments.length === 0) return null
    return (
      <div
        className="flex h-3 gap-[var(--space-xxs)]"
        role="img"
        aria-label={distributionLabel(segments)}
      >
        {segments.map((segment, index) => (
          <span
            key={segment.ticker}
            className="h-full min-w-1 rounded-[var(--radius-xs)]"
            style={{
              flexGrow: segment.pct,
              flexBasis: 0,
              backgroundColor: donutColor(index),
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-[var(--radius-m)] border border-border bg-card p-4">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="text-sm font-medium">Distribución</span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {segments.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground text-pretty">
          Agregá nominales para ver la composición.
        </p>
      ) : (
        <>
          <div
            className="mt-3 flex h-2.5 overflow-hidden rounded-md bg-muted"
            role="img"
            aria-label="Composición del portfolio"
          >
            {segments.map((segment, index) => (
              <div
                key={segment.ticker}
                className="h-full min-w-px"
                style={{
                  width: `${segment.pct}%`,
                  backgroundColor: donutColor(index),
                }}
                title={`${segment.ticker}: ${formatPercent(segment.pct)}`}
              />
            ))}
          </div>

          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-200 ease-out",
              expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="overflow-hidden">
              <ul className="mt-3 flex flex-col gap-1.5">
                {segments.map((segment, index) => (
                  <li
                    key={segment.ticker}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: donutColor(index) }}
                        aria-hidden
                      />
                      <span className="truncate font-mono font-medium">
                        {segment.ticker}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                      {formatPercent(segment.pct)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
