"use client"

import { useLayoutEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  SearchIcon,
} from "lucide-react"
import {
  type Cedear,
  formatArs,
  formatPct,
  parseRatio,
  pctClassName,
} from "@/lib/cedears"
import { filterRatiosCedears } from "@/lib/ratios"
import { logoUrl } from "@/lib/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
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

const numericCellClassName = "text-right font-mono tabular-nums text-sm"

const stickyHeadClassName =
  "bg-background max-md:sticky max-md:top-[var(--ratios-sticky-search-height,0px)] max-md:z-[5] md:sticky md:top-0 md:z-[5]"

type SortKey =
  | "ticker"
  | "name"
  | "underlying"
  | "ratio"
  | "price"
  | "pctChange"

type SortDir = "asc" | "desc"

function ariaSortValue(
  activeKey: SortKey,
  key: SortKey,
  direction: SortDir,
): "ascending" | "descending" | "none" {
  if (activeKey !== key) return "none"
  return direction === "asc" ? "ascending" : "descending"
}

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string
  active: boolean
  direction: SortDir
  onClick: () => void
}) {
  const Icon = !active
    ? ArrowUpDownIcon
    : direction === "asc"
      ? ArrowUpIcon
      : ArrowDownIcon

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 w-full touch-manipulation items-center gap-1 font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {label}
      <Icon className="size-3.5 shrink-0 opacity-60" aria-hidden />
    </button>
  )
}

function compareNullableNumber(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return a - b
}

export function CedearsThemeTable({
  cedears,
  hideUnderlying = false,
  searchInputId = "category-theme-search",
  showPreviousCloseLabel = false,
}: {
  cedears: Cedear[]
  hideUnderlying?: boolean
  searchInputId?: string
  showPreviousCloseLabel?: boolean
}) {
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("ticker")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const rootRef = useRef<HTMLDivElement>(null)
  const searchStickyRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const searchEl = searchStickyRef.current
    const root = rootRef.current
    if (!searchEl || !root) return

    const mobileQuery = window.matchMedia("(max-width: 767px)")

    const syncStickyOffset = () => {
      if (!mobileQuery.matches) {
        root.style.removeProperty("--ratios-sticky-search-height")
        return
      }
      root.style.setProperty(
        "--ratios-sticky-search-height",
        `${searchEl.getBoundingClientRect().height}px`,
      )
    }

    syncStickyOffset()
    const observer = new ResizeObserver(syncStickyOffset)
    observer.observe(searchEl)
    window.addEventListener("resize", syncStickyOffset)
    mobileQuery.addEventListener("change", syncStickyOffset)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", syncStickyOffset)
      mobileQuery.removeEventListener("change", syncStickyOffset)
      root.style.removeProperty("--ratios-sticky-search-height")
    }
  }, [query, cedears.length])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir(
      key === "price" || key === "ratio" || key === "pctChange" ? "desc" : "asc",
    )
  }

  const filtered = useMemo(
    () => filterRatiosCedears(cedears, query),
    [cedears, query],
  )

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === "ticker") {
        cmp = a.Cedears.localeCompare(b.Cedears)
      } else if (sortKey === "name") {
        cmp = a.Name.localeCompare(b.Name)
      } else if (sortKey === "underlying") {
        cmp = a.TickerOriginal.localeCompare(b.TickerOriginal)
      } else if (sortKey === "ratio") {
        cmp = compareNullableNumber(parseRatio(a.Ratio), parseRatio(b.Ratio))
      } else if (sortKey === "price") {
        cmp = compareNullableNumber(a.price, b.price)
      } else if (sortKey === "pctChange") {
        cmp = compareNullableNumber(a.pctChange, b.pctChange)
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const resultsLabel =
    filtered.length === 1 ? "1 resultado" : `${filtered.length} resultados`

  return (
    <div
      ref={rootRef}
      data-category-theme-table-root
      className="flex min-w-0 flex-col gap-3 max-md:[--ratios-sticky-search-height:0px]"
    >
      <div
        ref={searchStickyRef}
        id="category-theme-search-sticky"
        className="sticky top-0 z-10 -mx-[var(--space-l)] border-b border-border bg-background px-[var(--space-l)] py-3 md:static md:mx-0 md:border-0 md:px-0 md:py-0"
      >
        <label htmlFor={searchInputId} className="sr-only">
          Buscar en esta categoría
        </label>
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id={searchInputId}
            type="search"
            role="searchbox"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ticker, empresa o subyacente"
            className="min-h-11 pl-9"
            autoComplete="off"
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
          {resultsLabel}
        </p>
      </div>

      {sorted.length === 0 ? (
        <Empty className="rounded-[var(--radius-m)] border border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>Sin resultados</EmptyTitle>
            <EmptyDescription>
              {query.trim()
                ? `No encontramos “${query.trim()}”.`
                : "No hay CEDEARs para mostrar."}
            </EmptyDescription>
          </EmptyHeader>
          {query.trim() ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 touch-manipulation"
              onClick={() => setQuery("")}
            >
              Limpiar búsqueda
            </Button>
          ) : null}
        </Empty>
      ) : (
        <div
          data-category-theme-table-wrap
          className="box-border w-full max-w-full min-w-0 rounded-[var(--radius-m)] border border-border"
        >
          <Table
            scrollContainer={false}
            data-category-theme-table
            className="w-full max-w-full table-fixed md:min-w-[36rem] md:table-auto"
          >
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead
                  className={`w-[46%] md:w-auto md:min-w-[5.5rem] ${stickyHeadClassName}`}
                  aria-sort={ariaSortValue(sortKey, "ticker", sortDir)}
                >
                  <SortButton
                    label="Ticker"
                    active={sortKey === "ticker"}
                    direction={sortDir}
                    onClick={() => toggleSort("ticker")}
                  />
                </TableHead>
                <TableHead
                  className={`hidden min-w-[5rem] md:table-cell ${stickyHeadClassName}`}
                  aria-sort={ariaSortValue(sortKey, "name", sortDir)}
                >
                  <SortButton
                    label="Empresa"
                    active={sortKey === "name"}
                    direction={sortDir}
                    onClick={() => toggleSort("name")}
                  />
                </TableHead>
                {!hideUnderlying ? (
                  <TableHead
                    className={`hidden min-w-[4rem] md:table-cell ${stickyHeadClassName}`}
                    aria-sort={ariaSortValue(sortKey, "underlying", sortDir)}
                  >
                    <SortButton
                      label="Subyacente"
                      active={sortKey === "underlying"}
                      direction={sortDir}
                      onClick={() => toggleSort("underlying")}
                    />
                  </TableHead>
                ) : null}
                <TableHead
                  className={`w-[27%] text-right md:w-auto md:min-w-[3.5rem] ${stickyHeadClassName}`}
                  aria-sort={ariaSortValue(sortKey, "ratio", sortDir)}
                >
                  <span className="flex justify-end">
                    <SortButton
                      label="Ratio"
                      active={sortKey === "ratio"}
                      direction={sortDir}
                      onClick={() => toggleSort("ratio")}
                    />
                  </span>
                </TableHead>
                <TableHead
                  className={`w-[27%] text-right md:w-auto md:min-w-[4.5rem] ${stickyHeadClassName}`}
                  aria-sort={ariaSortValue(sortKey, "price", sortDir)}
                >
                  <span className="flex justify-end">
                    <SortButton
                      label="Precio"
                      active={sortKey === "price"}
                      direction={sortDir}
                      onClick={() => toggleSort("price")}
                    />
                  </span>
                </TableHead>
                <TableHead
                  className={`hidden text-right md:table-cell md:min-w-[4.5rem] ${stickyHeadClassName}`}
                  aria-sort={ariaSortValue(sortKey, "pctChange", sortDir)}
                  aria-label={
                    showPreviousCloseLabel
                      ? "Variación porcentual, cierre anterior"
                      : "Variación porcentual"
                  }
                >
                  <span className="flex flex-col items-end gap-0.5">
                    <SortButton
                      label="Var. %"
                      active={sortKey === "pctChange"}
                      direction={sortDir}
                      onClick={() => toggleSort("pctChange")}
                    />
                    {showPreviousCloseLabel ? (
                      <span className="text-xs font-normal leading-none text-muted-foreground">
                        cierre anterior
                      </span>
                    ) : null}
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((c) => {
                const pct = c.pctChange
                return (
                <TableRow key={c.Cedears} className="hover:bg-muted/50">
                  <TableCell scope="row" className="whitespace-normal p-0">
                    <Link
                      href={`/cedear/${c.Cedears}`}
                      className="flex min-h-11 max-w-full items-center gap-1.5 px-[var(--space-s)] py-2 font-mono text-sm font-medium underline-offset-4 hover:underline md:px-[var(--space-m)]"
                    >
                      <img
                        src={logoUrl(c.TickerOriginal)}
                        alt=""
                        width={18}
                        height={18}
                        className="size-[18px] shrink-0 rounded-sm bg-muted object-contain"
                        loading="lazy"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{c.Cedears}</span>
                        <span className="line-clamp-2 block font-sans text-xs leading-snug font-normal text-pretty text-muted-foreground md:hidden">
                          {c.Name}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden max-w-52 truncate text-sm text-muted-foreground md:table-cell">
                    {c.Name}
                  </TableCell>
                  {!hideUnderlying ? (
                    <TableCell className="hidden font-mono text-sm text-muted-foreground md:table-cell">
                      {c.TickerOriginal}
                    </TableCell>
                  ) : null}
                  <TableCell
                    className={`${numericCellClassName} px-[var(--space-xs)] md:px-[var(--space-s)]`}
                  >
                    {c.Ratio}:1
                  </TableCell>
                  <TableCell
                    className={`${numericCellClassName} px-[var(--space-xs)] md:px-[var(--space-s)]`}
                  >
                    {formatArs(c.price)}
                  </TableCell>
                  <TableCell
                    className={`hidden md:table-cell ${numericCellClassName} px-[var(--space-xs)] md:px-[var(--space-s)] ${pctClassName(pct)}`}
                  >
                    {formatPct(pct)}
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
