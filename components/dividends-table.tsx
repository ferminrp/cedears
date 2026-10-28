"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  SearchIcon,
} from "lucide-react"
import {
  type CedearDividendRow,
  filterDividendRows,
  filterDividendRowsByFrequency,
} from "@/lib/dividends"
import {
  formatEstimatedCedearUsd,
  formatFrequencyShort,
  formatShortDividendDate,
  formatUnderlyingYieldPercent,
} from "@/lib/dividend-display"
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

const numericCellClassName =
  "text-right font-mono tabular-nums text-sm whitespace-nowrap"

type SortKey = "ticker" | "yield" | "exDate" | "payDate"
type SortDir = "asc" | "desc"

const FREQUENCY_OPTIONS = [
  { value: "todas", label: "Todas" },
  { value: "mensual", label: "Mensual" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral-anual", label: "Semestral/Anual" },
] as const

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
      className="inline-flex min-h-11 w-full items-center gap-1 font-medium hover:text-foreground"
    >
      {label}
      <Icon className="size-3.5 shrink-0 opacity-60" />
    </button>
  )
}

function compareExDate(a: CedearDividendRow, b: CedearDividendRow): number {
  const aMissing = a.exDividendDate === null
  const bMissing = b.exDividendDate === null
  if (aMissing && !bMissing) return 1
  if (!aMissing && bMissing) return -1
  const exA = a.exDividendDate ?? ""
  const exB = b.exDividendDate ?? ""
  return exA.localeCompare(exB)
}

function compareNullableNumber(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return a - b
}

export function DividendsTable({ rows }: { rows: CedearDividendRow[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const frequencyParam = searchParams.get("frecuencia") ?? "todas"

  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("exDate")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const setFrequency = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === "todas") {
        params.delete("frecuencia")
      } else {
        params.set("frecuencia", value)
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir(key === "yield" ? "desc" : "asc")
  }

  const filtered = useMemo(() => {
    const bySearch = filterDividendRows(rows, query)
    return filterDividendRowsByFrequency(bySearch, frequencyParam)
  }, [frequencyParam, query, rows])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === "ticker") {
        cmp = a.cedear.localeCompare(b.cedear)
      } else if (sortKey === "yield") {
        cmp = compareNullableNumber(a.dividendYield, b.dividendYield)
      } else if (sortKey === "exDate") {
        cmp = compareExDate(a, b)
      } else if (sortKey === "payDate") {
        cmp = compareExDate(
          { ...a, exDividendDate: a.dividendPaymentDate },
          { ...b, exDividendDate: b.dividendPaymentDate },
        )
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const resultsLabel =
    filtered.length === 1 ? "1 resultado" : `${filtered.length} resultados`

  const hasActiveFilter =
    query.trim().length > 0 || (frequencyParam && frequencyParam !== "todas")

  function clearFilters() {
    setQuery("")
    setFrequency("todas")
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-0 z-10 -mx-[var(--space-l)] border-b border-border bg-background px-[var(--space-l)] py-3 md:static md:mx-0 md:border-0 md:px-0 md:py-0">
        <label htmlFor="dividendos-search" className="sr-only">
          Buscar CEDEAR
        </label>
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="dividendos-search"
            type="search"
            role="searchbox"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ticker, empresa o subyacente"
            className="pl-9"
            autoComplete="off"
          />
        </div>

        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Filtrar por frecuencia"
        >
          {FREQUENCY_OPTIONS.map((option) => {
            const active =
              option.value === "todas"
                ? !frequencyParam || frequencyParam === "todas"
                : frequencyParam === option.value
            return (
              <Button
                key={option.value}
                type="button"
                variant={active ? "default" : "outline"}
                size="sm"
                className="min-h-11 shrink-0"
                aria-pressed={active}
                onClick={() => setFrequency(option.value)}
              >
                {option.label}
              </Button>
            )
          })}
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
                : "No hay CEDEARs que coincidan con este filtro."}
              {" "}
              Probá con otro ticker o quitá el filtro de frecuencia.
            </EmptyDescription>
          </EmptyHeader>
          {hasActiveFilter ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={clearFilters}
            >
              Limpiar búsqueda
            </Button>
          ) : null}
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-m)] border border-border">
          <Table className="w-full min-w-[20rem]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead
                  className="min-w-[6.5rem] max-w-[40vw] md:max-w-none"
                  aria-sort={ariaSortValue(sortKey, "ticker", sortDir)}
                >
                  <SortButton
                    label="Ticker"
                    active={sortKey === "ticker"}
                    direction={sortDir}
                    onClick={() => toggleSort("ticker")}
                  />
                </TableHead>
                <TableHead className="hidden min-w-[8rem] md:table-cell">
                  Empresa
                </TableHead>
                <TableHead className="hidden min-w-[5rem] md:table-cell">
                  Subyacente
                </TableHead>
                <TableHead
                  className="min-w-[4rem] text-right"
                  aria-sort={ariaSortValue(sortKey, "yield", sortDir)}
                >
                  <span className="flex justify-end">
                    <SortButton
                      label="Yield"
                      active={sortKey === "yield"}
                      direction={sortDir}
                      onClick={() => toggleSort("yield")}
                    />
                  </span>
                </TableHead>
                <TableHead className="hidden min-w-[5rem] md:table-cell">
                  Frecuencia
                </TableHead>
                <TableHead
                  className="min-w-[4.5rem] text-right"
                  aria-sort={ariaSortValue(sortKey, "exDate", sortDir)}
                >
                  <span className="flex justify-end">
                    <SortButton
                      label="Ex-date"
                      active={sortKey === "exDate"}
                      direction={sortDir}
                      onClick={() => toggleSort("exDate")}
                    />
                  </span>
                </TableHead>
                <TableHead
                  className="hidden min-w-[4rem] text-right md:table-cell"
                  aria-sort={ariaSortValue(sortKey, "payDate", sortDir)}
                >
                  <span className="flex justify-end">
                    <SortButton
                      label="Pago"
                      active={sortKey === "payDate"}
                      direction={sortDir}
                      onClick={() => toggleSort("payDate")}
                    />
                  </span>
                </TableHead>
                <TableHead className="hidden min-w-[5.5rem] text-right lg:table-cell">
                  Cobro est.
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row) => (
                <TableRow key={row.cedear} className="hover:bg-muted/50">
                  <TableCell className="max-w-[40vw] p-0 md:max-w-none">
                    <Link
                      href={`/cedear/${row.cedear}`}
                      className="flex min-h-11 items-center gap-1.5 px-[var(--space-m)] py-2 font-mono text-sm font-medium underline-offset-4 hover:underline"
                    >
                      <img
                        src={logoUrl(row.tickerOriginal)}
                        alt=""
                        width={16}
                        height={16}
                        className="size-4 shrink-0 rounded-sm bg-muted object-contain"
                        loading="lazy"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{row.cedear}</span>
                        <span className="block truncate font-sans text-xs font-normal text-muted-foreground md:hidden">
                          {row.name} · {formatFrequencyShort(row.frequency)}
                        </span>
                        <span className="block truncate font-sans text-xs font-normal text-muted-foreground md:hidden">
                          Cobro est. {formatEstimatedCedearUsd(row.estimatedCedearUsd)} (estimado)
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden max-w-52 truncate text-sm text-muted-foreground md:table-cell">
                    {row.name}
                  </TableCell>
                  <TableCell className="hidden font-mono text-sm text-muted-foreground md:table-cell">
                    {row.tickerOriginal}
                  </TableCell>
                  <TableCell className={numericCellClassName}>
                    {formatUnderlyingYieldPercent(row.dividendYield)}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {formatFrequencyShort(row.frequency)}
                  </TableCell>
                  <TableCell className={numericCellClassName}>
                    {formatShortDividendDate(row.exDividendDate)}
                  </TableCell>
                  <TableCell className={`hidden md:table-cell ${numericCellClassName}`}>
                    {formatShortDividendDate(row.dividendPaymentDate)}
                  </TableCell>
                  <TableCell className={`hidden lg:table-cell ${numericCellClassName}`}>
                    <span className="block">{formatEstimatedCedearUsd(row.estimatedCedearUsd)}</span>
                    <span className="block text-xs font-sans text-muted-foreground">
                      estimado
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
