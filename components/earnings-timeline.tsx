"use client"

import { useMemo, useState } from "react"
import { CalendarIcon, SearchIcon } from "lucide-react"
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

const rangeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

function formatDateLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number)
  return dateFormatter.format(new Date(year, month - 1, day))
}

function formatRangeDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number)
  return rangeFormatter.format(new Date(year, month - 1, day))
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

  const visibleCedears = useMemo(
    () =>
      new Set(filteredDays.flatMap((day) => day.items.map((item) => item.cedear)))
        .size,
    [filteredDays],
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        {!(query.trim() && filteredDays.length === 0) ? (
          <p className="text-sm text-muted-foreground">
            {visibleCedears} CEDEAR{visibleCedears === 1 ? "" : "s"} con earnings entre{" "}
            <span className="text-foreground">
              {formatRangeDate(timeline.dateRange.start)}
            </span>{" "}
            y{" "}
            <span className="text-foreground">
              {formatRangeDate(timeline.dateRange.end)}
            </span>
            .
          </p>
        ) : null}

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
                      <li
                        key={`${day.date}-${item.cedear}`}
                        className="flex items-center gap-3"
                      >
                        <img
                          src={logoUrl(item.tickerOriginal)}
                          alt=""
                          width={32}
                          height={32}
                          className="size-8 shrink-0 rounded-md bg-muted object-contain"
                          loading="lazy"
                        />
                        <span className="w-14 shrink-0 font-medium tabular-nums">
                          {item.cedear}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {item.name}
                        </span>
                        {!item.isDateConfirmed ? (
                          <Badge variant="outline">Fecha estimada</Badge>
                        ) : null}
                        {timeLabel ? (
                          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                            {timeLabel}
                          </span>
                        ) : null}
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
