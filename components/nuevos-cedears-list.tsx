"use client"

import { useState } from "react"
import Link from "next/link"
import {
  type NuevoCedearRow,
  type NuevosCedearMonthGroup,
  formatDetectedSince,
  formatNuevosRatio,
  isNuevoCedearBadge,
} from "@/lib/nuevos-cedears"
import { logoUrl } from "@/lib/logo"
import { cn } from "@/lib/utils"
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

const stickyHeadClassName = "bg-background md:sticky md:top-0 md:z-[5]"

const tableColGroup = (
  <colgroup>
    <col className="w-[16%]" />
    <col />
    <col className="w-[9rem]" />
    <col className="w-[5rem]" />
  </colgroup>
)

function NuevoBadge() {
  return (
    <span className="rounded-full border border-ring px-1.5 py-px text-[11px] font-medium text-foreground">
      Nuevo
    </span>
  )
}

function TickerLogoInitial({ ticker }: { ticker: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-muted text-[10px] font-semibold uppercase text-foreground"
    >
      {ticker.charAt(0)}
    </span>
  )
}

function TickerLogo({
  ticker,
  tickerOriginal,
}: {
  ticker: string
  tickerOriginal: string
}) {
  const [imageVisible, setImageVisible] = useState(false)
  const src = logoUrl(tickerOriginal)

  if (!src) {
    return <TickerLogoInitial ticker={ticker} />
  }

  const syncImageState = (img: HTMLImageElement) => {
    if (img.naturalWidth > 0) {
      setImageVisible(true)
    } else {
      setImageVisible(false)
    }
  }

  return (
    <span className="relative inline-flex size-5 shrink-0">
      <TickerLogoInitial ticker={ticker} />
      <img
        ref={(node) => {
          if (!node) return
          if (node.complete) {
            syncImageState(node)
          }
        }}
        src={src}
        alt=""
        width={20}
        height={20}
        className={cn(
          "absolute inset-0 size-5 rounded-sm bg-muted object-contain",
          imageVisible ? "opacity-100" : "opacity-0",
        )}
        loading="lazy"
        decoding="async"
        onLoad={(event) => syncImageState(event.currentTarget)}
        onError={() => setImageVisible(false)}
      />
    </span>
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
                <TickerLogo
                  ticker={row.ticker}
                  tickerOriginal={row.tickerOriginal}
                />
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
      className="hidden w-full table-fixed md:table"
    >
      {tableColGroup}
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
                  <TickerLogo
                    ticker={row.ticker}
                    tickerOriginal={row.tickerOriginal}
                  />
                  <span className="font-mono text-sm font-medium">
                    {row.ticker}
                  </span>
                  {showBadge ? <NuevoBadge /> : null}
                </Link>
              </TableCell>
              <TableCell className="truncate text-sm text-muted-foreground">
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
          className={`mb-2.5 flex flex-wrap items-baseline gap-2 text-[length:var(--size-l)] font-semibold leading-[var(--line-l)] tracking-[var(--letter-spacing-l)]${isFirstGroup ? "" : " mt-7"}`}
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

function renderGroupSections(
  groups: NuevosCedearMonthGroup[],
  referenceTime: number,
  options?: { sectionPrefix?: string; firstSectionOffset?: boolean },
) {
  const showHeadings = groups.some((group) => group.heading)
  return groups.map((group, index) => (
    <MonthSection
      key={`${options?.sectionPrefix ?? "recent"}-${group.id}`}
      group={group}
      referenceTime={referenceTime}
      showHeading={showHeadings && Boolean(group.heading)}
      isFirstGroup={options?.firstSectionOffset ? false : index === 0}
    />
  ))
}

export function NuevosCedearsList({
  groups,
  expandedGroups,
  olderGroups,
  archiveCount,
  referenceTime,
}: {
  groups: NuevosCedearMonthGroup[]
  expandedGroups: NuevosCedearMonthGroup[]
  olderGroups: NuevosCedearMonthGroup[]
  archiveCount: number
  referenceTime: number
}) {
  const [showArchive, setShowArchive] = useState(false)
  const recentCount = expandedGroups.flatMap((group) => group.rows).length

  if (recentCount === 0 && olderGroups.length === 0) {
    return (
      <Empty className="mt-4 rounded-[var(--radius-m)] border border-border">
        <EmptyHeader>
          <EmptyTitle>Todavía no hay altas nuevas</EmptyTitle>
          <EmptyDescription>
            No se listaron CEDEARs nuevos en los últimos 6 meses.
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

  const archiveLabel =
    archiveCount > 0 ? ` (${archiveCount} más)` : ""

  return (
    <div className="mt-4 flex flex-col gap-2">
      {showArchive
        ? renderGroupSections(expandedGroups, referenceTime)
        : renderGroupSections(groups, referenceTime)}

      {showArchive && olderGroups.length > 0 ? (
        <section aria-labelledby="nuevos-cedears-older-heading" className="mt-4">
          <h2
            id="nuevos-cedears-older-heading"
            className="mb-2.5 text-[length:var(--size-l)] font-semibold leading-[var(--line-l)] tracking-[var(--letter-spacing-l)]"
          >
            Altas de más de 6 meses
          </h2>
          {renderGroupSections(olderGroups, referenceTime, {
            sectionPrefix: "older",
            firstSectionOffset: true,
          })}
        </section>
      ) : null}

      {showArchive && olderGroups.length === 0 && archiveCount === 0 ? (
        <p className="text-sm text-foreground/70">
          No hay altas anteriores fuera de la ventana de 6 meses.
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setShowArchive((value) => !value)}
        className="inline-flex min-h-11 items-center self-start text-sm font-medium text-foreground underline-offset-4 hover:underline"
        aria-expanded={showArchive}
      >
        {showArchive
          ? "Ocultar altas anteriores"
          : `Ver altas anteriores${archiveLabel}`}
      </button>
    </div>
  )
}
