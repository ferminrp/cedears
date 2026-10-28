"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  SearchIcon,
} from "lucide-react"
import { CedearTableSearch } from "@/components/cedear-table-search"
import {
  type CedearDividendRow,
  filterDividendRows,
  filterDividendRowsByFrequency,
} from "@/lib/dividends"
import {
  formatEstimatedCedearUsd,
  formatEstimatedCedearUsdCompact,
  formatFrequencyShort,
  formatShortDividendDate,
  formatUnderlyingYieldPercent,
} from "@/lib/dividend-display"
import {
  sortDividendRows,
  type DividendSortDir,
  type DividendSortKey,
} from "@/lib/dividend-sort"
import { logoUrl } from "@/lib/logo"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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

const FREQUENCY_OPTIONS = [
  { value: "todas", label: "Todas" },
  { value: "mensual", label: "Mensual" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral-anual", label: "Semestral/Anual" },
] as const

function ariaSortValue(
  activeKey: DividendSortKey,
  key: DividendSortKey,
  direction: DividendSortDir,
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
  direction: DividendSortDir
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

type DividendsTableProps = {
  rows: CedearDividendRow[]
  referenceDateIso: string
  initialFrequency: string
}

export function DividendsTable({
  rows,
  referenceDateIso,
  initialFrequency,
}: DividendsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState("")
  const [frequencyParam, setFrequencyParam] = useState(initialFrequency)
  const [sortKey, setSortKey] = useState<DividendSortKey>("exDate")
  const [sortDir, setSortDir] = useState<DividendSortDir>("asc")

  useEffect(() => {
    setFrequencyParam(searchParams.get("frecuencia") ?? "todas")
  }, [searchParams])

  const setFrequency = useCallback(
    (value: string) => {
      setFrequencyParam(value)
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

  function toggleSort(key: DividendSortKey) {
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

  const sorted = useMemo(
    () => sortDividendRows(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir],
  )

  const resultsLabel =
    filtered.length === 1 ? "1 resultado" : `${filtered.length} resultados`

  const hasActiveFilter =
    query.trim().length > 0 || (frequencyParam && frequencyParam !== "todas")

  function clearFilters() {
    setQuery("")
    setFrequency("todas")
  }

  const frequencyFilters = (
    <ToggleGroup
      value={[frequencyParam]}
      onValueChange={(values) => {
        const next = values[0] ?? "todas"
        setFrequency(next)
      }}
      aria-label="Filtrar por frecuencia"
      variant="outline"
      size="sm"
      className="flex w-max max-w-full flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {FREQUENCY_OPTIONS.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="min-h-11 shrink-0"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )

  return (
    <div className="flex flex-col gap-3">
      <CedearTableSearch
        id="dividendos-search"
        query={query}
        onQueryChange={setQuery}
        resultsLabel={resultsLabel}
        filters={frequencyFilters}
      />

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
                      label="Yield (USD)"
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
                <TableHead className="hidden min-w-[5.5rem] text-right md:table-cell">
                  Cobro est.
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row) => {
                const mobileSubline = `${row.name} · ${formatFrequencyShort(row.frequency)} · Cobro estimado ${formatEstimatedCedearUsdCompact(row.estimatedCedearUsd)}`
                return (
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
                            {mobileSubline}
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
                      {formatShortDividendDate(
                        row.exDividendDate,
                        referenceDateIso,
                      )}
                    </TableCell>
                    <TableCell className={`hidden md:table-cell ${numericCellClassName}`}>
                      {formatShortDividendDate(
                        row.dividendPaymentDate,
                        referenceDateIso,
                      )}
                    </TableCell>
                    <TableCell className={`hidden md:table-cell ${numericCellClassName}`}>
                      <span className="block">
                        {formatEstimatedCedearUsd(row.estimatedCedearUsd)}
                      </span>
                      <span className="block text-xs font-sans text-muted-foreground">
                        estimado
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
