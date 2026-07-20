"use client"

import { useMemo, useState } from "react"
import { ArrowUpRight, CalendarIcon, SearchIcon } from "lucide-react"
import type { EarningsDay, EarningsTimeline } from "@/lib/earnings"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

const LOGO_DEV_TOKEN = "pk_aOjcq-uNRdm3AWE9VR3rIA"

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
})

function formatDateLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number)
  return dateFormatter.format(new Date(year, month - 1, day))
}

function formatEarningsTime(time: string | null): string | null {
  if (!time) return null
  const [hours, minutes] = time.split(":")
  if (!hours || !minutes) return null
  return `${hours}:${minutes} ET`
}

function logoUrl(ticker: string): string {
  const encoded = encodeURIComponent(ticker.trim().toUpperCase())
  const params = new URLSearchParams({
    token: LOGO_DEV_TOKEN,
    format: "webp",
    retina: "true",
  })
  return `https://img.logo.dev/ticker/${encoded}?${params.toString()}`
}

function perplexityEarningsUrl(ticker: string): string {
  return `https://www.perplexity.ai/finance/${encodeURIComponent(ticker.trim().toUpperCase())}/earnings`
}

function matchesQuery(
  item: EarningsDay["items"][number],
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  return (
    item.cedear.toLowerCase().includes(normalized) ||
    item.name.toLowerCase().includes(normalized) ||
    item.tickerOriginal.toLowerCase().includes(normalized)
  )
}

export function EarningsTimelineView({ timeline }: { timeline: EarningsTimeline }) {
  const [query, setQuery] = useState("")

  const filteredDays = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return timeline.days

    return timeline.days
      .map((day) => ({
        ...day,
        items: day.items.filter((item) => matchesQuery(item, query)),
      }))
      .filter((day) => day.items.length > 0)
  }, [query, timeline.days])

  return (
    <div className="flex flex-col gap-6">
      <div className="relative w-full sm:max-w-xs">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por ticker o empresa..."
          className="pl-9"
          aria-label="Buscar earnings"
        />
      </div>

      {filteredDays.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarIcon />
            </EmptyMedia>
            <EmptyTitle>Sin resultados</EmptyTitle>
            <EmptyDescription>
              No hay CEDEARs con earnings que coincidan con tu búsqueda.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ol className="relative flex flex-col gap-8 border-l border-border pl-6">
          {filteredDays.map((day) => (
            <li key={day.date} className="relative">
              <span
                aria-hidden
                className="absolute top-1.5 -left-[calc(1.5rem+0.3125rem)] size-2.5 rounded-full border-2 border-background bg-foreground"
              />

              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-medium capitalize text-foreground">
                  {formatDateLabel(day.date)}
                </h2>

                <ul className="flex flex-col gap-3">
                  {day.items.map((item) => {
                    const timeLabel = formatEarningsTime(item.earningsTime)

                    return (
                      <li key={`${day.date}-${item.cedear}`}>
                        <a
                          href={perplexityEarningsUrl(item.tickerOriginal)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-md px-2 py-1.5 -mx-2 transition-colors hover:bg-muted/50"
                        >
                          <img
                            src={logoUrl(item.tickerOriginal)}
                            alt=""
                            width={32}
                            height={32}
                            className="size-8 shrink-0 rounded-md bg-muted object-contain"
                            loading="lazy"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {item.name}
                            </p>
                            <p className="truncate text-sm font-normal text-muted-foreground tabular-nums">
                              {item.cedear}
                              {timeLabel ? (
                                <>
                                  <span aria-hidden className="mx-1">
                                    ·
                                  </span>
                                  {timeLabel}
                                </>
                              ) : null}
                            </p>
                          </div>
                          {!item.isDateConfirmed ? (
                            <Badge variant="outline">Fecha estimada</Badge>
                          ) : null}
                          <ArrowUpRight
                            aria-hidden
                            className="size-4 shrink-0 text-muted-foreground"
                          />
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
