"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { SearchIcon } from "lucide-react"
import {
  type NuevoCedearRow,
  type NuevosCedearMonthGroup,
  filterNuevosCedearsQuery,
  formatDetectedSince,
  formatNuevosRatio,
  isNuevoCedearBadge,
} from "@/lib/nuevos-cedears"
import { logoUrl } from "@/lib/logo"
import { Input } from "@/components/ui/input"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const stickyHeadClassName =
  "bg-background md:sticky md:top-0 md:z-[5]"

function NuevoBadge() {
  return (
    <span className="rounded-full border border-ring px-1.5 py-px text-[11px] font-medium text-foreground">
      Nuevo
    </span>
  )
}

function TickerLogo({ tickerOriginal }: { tickerOriginal: string }) {
  return (
    <img
      src={logoUrl(tickerOriginal)}
      alt=""
      width={20}
      height={20}
      className="size-5 shrink-0 rounded-sm bg-muted object-contain"
      loading="lazy"
    />
  )
}

function MobileRows({
  rows,
  referenceTime,
}: {
  rows: NuevoCedearRow[]
  referenceTime: number
}) {
  const referenceDate = new Date(referenceTime)
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-m)] border border-border md:hidden">
      {rows.map((row) => {
        const ratio = formatNuevosRatio(row.ratio)
        const showBadge = isNuevoCedearBadge(row.detectedSince, referenceDate)
        return (
          <li key={row.ticker}>
            <Link
              href={`/cedear/${row.ticker}`}
              className="grid min-h-16 grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 px-3.5 py-3 text-inherit no-underline hover:bg-muted/50 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
            >
              <span className="col-start-1 flex items-center gap-2">
                <TickerLogo tickerOriginal={row.tickerOriginal} />
                <span className="font-mono text-sm font-medium">{row.ticker}</span>
                {showBadge ? <NuevoBadge /> : null}
              </span>
              <span
                className="col-start-2 row-span-2 self-center text-muted-foreground"
                aria-hidden
              >
                ›
              </span>
              <span className="col-start-1 line-clamp-2 text-xs text-muted-foreground">
                {row.name}
              </span>
              <dl className="col-span-2 mt-2 flex gap-5 text-xs">
                <div>
                  <dt className="text-foreground/70">Fecha de alta</dt>
                  <dd className="text-sm font-medium tabular-nums">
                    <time dateTime={row.detectedSince}>
                      {formatDetectedSince(row.detectedSince)}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt className="text-foreground/70">Ratio</dt>
                  <dd
                    className="text-sm font-medium tabular-nums"
                    aria-label={ratio.ariaLabel}
                  >
                    {ratio.display}
                  </dd>
                </div>
              </dl>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function DesktopTable({
  rows,
  referenceTime,
}: {
  rows: NuevoCedearRow[]
  referenceTime: number
}) {
  const referenceDate = new Date(referenceTime)
  return (
    <Table
      scrollContainer={false}
      className="hidden w-full table-auto md:table"
    >
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead scope="col" className={stickyHeadClassName}>
            Ticker
          </TableHead>
          <TableHead scope="col" className={stickyHeadClassName}>
            Empresa
          </TableHead>
          <TableHead
            scope="col"
            className={`text-right ${stickyHeadClassName}`}
          >
            Fecha de alta
          </TableHead>
          <TableHead
            scope="col"
            className={`text-right ${stickyHeadClassName}`}
          >
            Ratio
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const ratio = formatNuevosRatio(row.ratio)
          const showBadge = isNuevoCedearBadge(row.detectedSince, referenceDate)
          return (
            <TableRow
              key={row.ticker}
              className="relative hover:bg-muted/50 has-[.row-link:focus-visible]:outline-solid has-[.row-link:focus-visible]:outline-2 has-[.row-link:focus-visible]:outline-offset-[-2px] has-[.row-link:focus-visible]:outline-ring"
            >
              <TableCell scope="row" className="p-0">
                <Link
                  href={`/cedear/${row.ticker}`}
                  className="row-link flex min-h-[3.25rem] items-center gap-2 px-4 after:absolute after:inset-0 focus-visible:outline-none"
                >
                  <TickerLogo tickerOriginal={row.tickerOriginal} />
                  <span className="font-mono text-sm font-medium">
                    {row.ticker}
                  </span>
                  {showBadge ? <NuevoBadge /> : null}
                </Link>
              </TableCell>
              <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                {row.name}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                <time dateTime={row.detectedSince}>
                  {formatDetectedSince(row.detectedSince)}
                </time>
              </TableCell>
              <TableCell
                className="text-right font-mono text-sm tabular-nums"
                aria-label={ratio.ariaLabel}
              >
                {ratio.display}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function MonthSection({
  group,
  referenceTime,
  showHeading,
  isFirstGroup,
}: {
  group: NuevosCedearMonthGroup
  referenceTime: number
  showHeading: boolean
  isFirstGroup: boolean
}) {
  return (
    <section aria-labelledby={showHeading ? group.id : undefined}>
      {showHeading ? (
        <h2
          id={group.id}
          className={`mb-2.5 flex flex-wrap items-baseline gap-2 text-[length:var(--size-m)] font-semibold leading-[var(--line-m)]${isFirstGroup ? "" : " mt-7"}`}
        >
          {group.heading}
          <span className="text-xs font-normal text-foreground/70">
            {group.countLabel}
          </span>
        </h2>
      ) : null}
      <MobileRows rows={group.rows} referenceTime={referenceTime} />
      <DesktopTable rows={group.rows} referenceTime={referenceTime} />
    </section>
  )
}

export function NuevosCedearsList({
  groups,
  needsSearch,
  referenceTime,
}: {
  groups: NuevosCedearMonthGroup[]
  needsSearch: boolean
  referenceTime: number
}) {
  const [query, setQuery] = useState("")
  const allRows = useMemo(
    () => groups.flatMap((group) => group.rows),
    [groups],
  )
  const filteredRows = useMemo(
    () => filterNuevosCedearsQuery(allRows, query),
    [allRows, query],
  )
  const filteredGroups = useMemo(() => {
    if (!query.trim()) return groups
    if (groups.length === 1 && !groups[0].heading) {
      return [{ ...groups[0], rows: filteredRows }]
    }
    const allowed = new Set(filteredRows.map((row) => row.ticker))
    return groups
      .map((group) => ({
        ...group,
        rows: group.rows.filter((row) => allowed.has(row.ticker)),
      }))
      .filter((group) => group.rows.length > 0)
  }, [filteredRows, groups, query])

  if (allRows.length === 0) {
    return (
      <Empty className="mt-6 rounded-[var(--radius-m)] border border-border">
        <EmptyHeader>
          <EmptyTitle>Todavía no hay altas nuevas</EmptyTitle>
          <EmptyDescription>
            No se listaron CEDEARs nuevos en los últimos 12 meses.
          </EmptyDescription>
        </EmptyHeader>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-medium text-foreground underline-offset-4 hover:underline"
        >
          Ver el listado completo →
        </Link>
      </Empty>
    )
  }

  const showHeadings = groups.some((group) => group.heading)

  return (
    <div className="mt-6 flex flex-col gap-2">
      {needsSearch ? (
        <div className="sticky top-0 z-10 -mx-[var(--space-s)] bg-background px-[var(--space-s)] pb-3 pt-1 md:static md:mx-0 md:px-0 md:pb-0">
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por ticker o empresa"
              aria-label="Buscar en nuevos CEDEARs"
              className="min-h-11 pl-9"
            />
          </div>
        </div>
      ) : null}

      {filteredGroups.length === 0 ? (
        <Empty className="rounded-[var(--radius-m)] border border-border">
          <EmptyHeader>
            <EmptyTitle>Sin resultados</EmptyTitle>
            <EmptyDescription>
              Probá con otro ticker o nombre de empresa.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        filteredGroups.map((group, index) => (
          <MonthSection
            key={group.id}
            group={group}
            referenceTime={referenceTime}
            showHeading={showHeadings && Boolean(group.heading)}
            isFirstGroup={index === 0}
          />
        ))
      )}
    </div>
  )
}
