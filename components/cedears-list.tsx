"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  CopyIcon,
  DownloadIcon,
  FileTextIcon,
  PinIcon,
  PinOffIcon,
  SearchIcon,
  TableIcon,
} from "lucide-react"
import { toast } from "sonner"
import {
  SEARCH_TICKER_DEBOUNCE_MS,
  SEARCH_TICKER_MIN_QUERY_LEN,
  trackSearchTicker,
  trackSelectTicker,
} from "@/lib/analytics"
import { type Cedear, toCsv, toMarkdown } from "@/lib/cedears"
import { selectHomeTableCedears } from "@/lib/home-page"
import { getUniqueTags } from "@/lib/cedear-tags"
import { readRecentCedears } from "@/lib/recent-cedears"
import { logoUrl } from "@/lib/logo"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { CedearDetailSheet } from "@/components/cedear-detail-sheet"

const ALL_MARKETS = "all"
const ALL_TAGS = "all"
const DEFAULT_SORT = "default"
const PCT_SORT_ASC = "pct-asc"
const PCT_SORT_DESC = "pct-desc"
const PINNED_STORAGE_KEY = "cedears-pinned"

type PctSort = typeof DEFAULT_SORT | typeof PCT_SORT_ASC | typeof PCT_SORT_DESC

function comparePctChange(
  a: number | null,
  b: number | null,
  direction: "asc" | "desc",
): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return direction === "asc" ? a - b : b - a
}

function orderWithPins(items: Cedear[], pinned: string[]): Cedear[] {
  if (pinned.length === 0) return items

  const pinnedSet = new Set(pinned)
  const itemsByTicker = new Map(items.map((item) => [item.Cedears, item]))
  const pinnedItems = pinned
    .map((ticker) => itemsByTicker.get(ticker))
    .filter((item): item is Cedear => item !== undefined)
  const unpinnedItems = items.filter((item) => !pinnedSet.has(item.Cedears))

  return [...pinnedItems, ...unpinnedItems]
}

function readPinnedTickers(): string[] {
  try {
    const stored = localStorage.getItem(PINNED_STORAGE_KEY)
    if (!stored) return []

    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((ticker): ticker is string => typeof ticker === "string")
  } catch {
    return []
  }
}

const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const pctFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
})

// A CEDEAR without a live quote renders a dash instead of "$ NaN".
function formatPrice(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—"
  return priceFormatter.format(value)
}

function formatPctChange(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—"
  return `${pctFormatter.format(value)}%`
}

function pctChangeClassName(value: number | null | undefined): string {
  if (value == null || value === 0 || !Number.isFinite(value)) return "text-muted-foreground"
  if (value > 0) return "text-success"
  return "text-destructive"
}

const numericCellClassName = "text-right font-mono tabular-nums"

/** Phones (< md): filter selects render as a scrollable row of pill chips. */
const CHIP_CLASS_NAME =
  "max-md:min-h-11 max-md:shrink-0 max-md:snap-start max-md:rounded-full max-md:px-[var(--space-l)] max-md:text-[length:var(--size-m)] max-md:leading-[var(--line-m)]"
const CHIP_ACTIVE_CLASS_NAME =
  "max-md:bg-foreground max-md:text-background max-md:[&_svg]:text-background"

function ChipLabel({ mobile, desktop }: { mobile: string; desktop: string }) {
  return (
    <>
      <span className="md:hidden">{mobile}</span>
      <span className="max-md:hidden">{desktop}</span>
    </>
  )
}
const empresaCellClassName = "max-w-52 text-muted-foreground"

type CedearsListProps = {
  cedears: Cedear[]
  tableCaption?: ReactNode
  /** Fetch full list when the user focuses search or opens a filter (home). */
  loadJsonOnInteraction?: () => void
  /** Hide the table until `cedears` is populated (home toolbar shell). */
  toolbarOnlyUntilData?: boolean
  /** When no filters/search, show only the top N by volume (home). */
  previewRowLimit?: number
}

export function CedearsList({
  cedears: initialCedears,
  tableCaption,
  loadJsonOnInteraction,
  toolbarOnlyUntilData = false,
  previewRowLimit,
}: CedearsListProps) {
  const [cedears, setCedears] = useState(initialCedears)
  const [query, setQuery] = useState("")
  const [market, setMarket] = useState(ALL_MARKETS)
  const [tag, setTag] = useState(ALL_TAGS)
  const [pctSort, setPctSort] = useState<PctSort>(DEFAULT_SORT)
  const [pinned, setPinned] = useState<string[]>([])
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const [recentTickers, setRecentTickers] = useState<string[]>([])
  const pinsHydratedRef = useRef(false)
  const recentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCedears(initialCedears)
  }, [initialCedears])

  const selected = useMemo(() => {
    if (!selectedTicker) return null
    return cedears.find((c) => c.Cedears === selectedTicker) ?? null
  }, [cedears, selectedTicker])

  useEffect(() => {
    if (selectedTicker !== null && selected === null) {
      setSelectedTicker(null)
    }
  }, [selectedTicker, selected])

  const tickerFingerprint = useMemo(
    () => cedears.map((c) => c.Cedears).sort().join("|"),
    [cedears],
  )

  const validTickers = useMemo(() => {
    if (!tickerFingerprint) return new Set<string>()
    return new Set(tickerFingerprint.split("|"))
  }, [tickerFingerprint])

  const visiblePins = useMemo(
    () => pinned.filter((ticker) => validTickers.has(ticker)),
    [pinned, validTickers],
  )

  useEffect(() => {
    setPinned((current) => {
      if (!pinsHydratedRef.current) {
        pinsHydratedRef.current = true
        return readPinnedTickers().filter((ticker) => validTickers.has(ticker))
      }

      const pruned = current.filter((ticker) => validTickers.has(ticker))
      return pruned.length === current.length ? current : pruned
    })
  }, [validTickers])

  useEffect(() => {
    if (!pinsHydratedRef.current) return
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinned))
  }, [pinned])

  const trimmedQuery = query.trim()

  useEffect(() => {
    if (trimmedQuery.length < SEARCH_TICKER_MIN_QUERY_LEN) return

    const timeoutId = window.setTimeout(() => {
      trackSearchTicker({ query_len: trimmedQuery.length })
    }, SEARCH_TICKER_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [trimmedQuery])

  function togglePin(ticker: string) {
    setPinned((current) => {
      if (current.includes(ticker)) {
        return current.filter((item) => item !== ticker)
      }
      return [ticker, ...current]
    })
  }

  function selectTicker(ticker: string) {
    trackSelectTicker({ ticker })
    setSelectedTicker(ticker)
  }

  const markets = useMemo(() => {
    const set = new Set(cedears.map((c) => c.Market).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [cedears])

  const tags = useMemo(() => getUniqueTags(cedears), [cedears])

  const hasActiveFilters = useMemo(() => {
    return (
      query.trim() !== "" ||
      market !== ALL_MARKETS ||
      tag !== ALL_TAGS ||
      pctSort !== DEFAULT_SORT
    )
  }, [query, market, tag, pctSort])

  function requestDataLoad() {
    loadJsonOnInteraction?.()
  }

  const isFiltering =
    query.trim() !== "" || market !== ALL_MARKETS || tag !== ALL_TAGS

  function clearFilters() {
    setQuery("")
    setMarket(ALL_MARKETS)
    setTag(ALL_TAGS)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cedears.filter((c) => {
      const matchesMarket = market === ALL_MARKETS || c.Market === market
      const matchesTag = tag === ALL_TAGS || c.tags.includes(tag)
      const matchesQuery =
        q === "" ||
        c.Cedears.toLowerCase().includes(q) ||
        c.Name.toLowerCase().includes(q) ||
        c.TickerOriginal.toLowerCase().includes(q)
      return matchesMarket && matchesTag && matchesQuery
    })
  }, [cedears, query, market, tag])

  const displayed = useMemo(() => {
    let items = filtered

    if (
      previewRowLimit &&
      !hasActiveFilters &&
      items.length > previewRowLimit
    ) {
      items = selectHomeTableCedears(items)
    }

    if (pctSort !== DEFAULT_SORT) {
      const direction = pctSort === PCT_SORT_ASC ? "asc" : "desc"
      items = [...filtered].sort((a, b) =>
        comparePctChange(a.pctChange, b.pctChange, direction),
      )
    }

    return orderWithPins(items, visiblePins)
  }, [filtered, pctSort, visiblePins, previewRowLimit, hasActiveFilters])

  async function copyToClipboard(content: string, label: string) {
    try {
      await navigator.clipboard.writeText(content)
      toast.success(`${label} copiado al portapapeles`, {
        description: `${displayed.length} CEDEARs`,
      })
    } catch {
      toast.error("No se pudo copiar al portapapeles")
    }
  }

  function download(content: string, filename: string, mime: string, label: string) {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success(`${label} descargado`, {
      description: `${displayed.length} CEDEARs`,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por ticker o nombre..."
            value={query}
            onFocus={() => {
              requestDataLoad()
              setRecentTickers(readRecentCedears())
              setSearchFocused(true)
            }}
            onBlur={(event) => {
              const next = event.relatedTarget
              if (next instanceof Node && recentRef.current?.contains(next)) return
              setSearchFocused(false)
            }}
            onChange={(e) => {
              requestDataLoad()
              setQuery(e.target.value)
            }}
            className="pl-9 max-md:min-h-12"
            aria-label="Buscar CEDEARs"
          />
        </div>

        {searchFocused && query === "" && recentTickers.length > 0 ? (
          <div
            ref={recentRef}
            className="flex flex-col gap-[var(--space-xs)] md:hidden"
            // Keep focus in the field while tapping a chip, so the row doesn't vanish mid-tap.
            // mousedown (not pointerdown): cancelling it only blocks the focus change and
            // never the click that follows, on touch included.
            onMouseDown={(event) => event.preventDefault()}
            onBlur={(event) => {
              const next = event.relatedTarget
              if (next instanceof Node && event.currentTarget.contains(next)) return
              setSearchFocused(false)
            }}
          >
            <h2 className="text-sm font-medium text-muted-foreground">
              Vistos hace poco
            </h2>
            <ul className="flex flex-wrap gap-[var(--space-s)]">
              {recentTickers.map((ticker) => (
                <li key={ticker}>
                  <Link
                    href={`/cedear/${ticker}`}
                    onClick={() => trackSelectTicker({ ticker })}
                    className="inline-flex min-h-11 items-center rounded-full bg-muted px-[var(--space-l)] font-mono text-[length:var(--size-m)] font-medium"
                  >
                    {ticker}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div
          className="cl-chips flex flex-row gap-[var(--space-s)] max-md:-mx-[var(--space-l)] max-md:snap-x max-md:overflow-x-auto max-md:scroll-px-[var(--space-l)] max-md:px-[var(--space-l)] md:items-center md:gap-3"
          role="group"
          aria-label="Filtros"
        >
          <Select
            value={market}
            onValueChange={setMarket}
            onOpenChange={(open) => {
              if (open) requestDataLoad()
            }}
          >
            <SelectTrigger
              className={`bg-muted md:w-52 md:bg-card ${CHIP_CLASS_NAME} ${market !== ALL_MARKETS ? CHIP_ACTIVE_CLASS_NAME : ""}`}
              aria-label="Filtrar por mercado"
            >
              <SelectValue placeholder="Mercado">
                {(value: string) =>
                  value === ALL_MARKETS ? (
                    <ChipLabel mobile="Mercado" desktop="Todos los mercados" />
                  ) : (
                    value
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL_MARKETS}>Todos los mercados</SelectItem>
                {markets.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={tag}
            onValueChange={setTag}
            onOpenChange={(open) => {
              if (open) requestDataLoad()
            }}
          >
            <SelectTrigger
              className={`bg-muted md:w-52 md:bg-card ${CHIP_CLASS_NAME} ${tag !== ALL_TAGS ? CHIP_ACTIVE_CLASS_NAME : ""}`}
              aria-label="Filtrar por categoría"
            >
              <SelectValue placeholder="Categoría">
                {(value: string) =>
                  value === ALL_TAGS ? (
                    <ChipLabel mobile="Categoría" desktop="Todas las categorías" />
                  ) : (
                    value
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL_TAGS}>Todas las categorías</SelectItem>
                {tags.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={pctSort}
            onValueChange={(value) => setPctSort(value as PctSort)}
            onOpenChange={(open) => {
              if (open) requestDataLoad()
            }}
          >
            <SelectTrigger
              className={`bg-muted md:w-56 md:bg-card ${CHIP_CLASS_NAME} ${pctSort !== DEFAULT_SORT ? CHIP_ACTIVE_CLASS_NAME : ""}`}
              aria-label="Ordenar por variación"
            >
              <SelectValue placeholder="Ordenar">
                {(value: string) => {
                  if (value === PCT_SORT_DESC) {
                    return <ChipLabel mobile="Mayor var. %" desktop="Var. % mayor a menor" />
                  }
                  if (value === PCT_SORT_ASC) {
                    return <ChipLabel mobile="Menor var. %" desktop="Var. % menor a mayor" />
                  }
                  return <ChipLabel mobile="Ordenar" desktop="Sin ordenar" />
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={DEFAULT_SORT}>
                  <ArrowUpDownIcon data-icon="inline-start" />
                  Sin ordenar
                </SelectItem>
                <SelectItem value={PCT_SORT_DESC}>
                  <ArrowDownIcon data-icon="inline-start" />
                  Var. % mayor a menor
                </SelectItem>
                <SelectItem value={PCT_SORT_ASC}>
                  <ArrowUpIcon data-icon="inline-start" />
                  Var. % menor a mayor
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Count while filtering: visible on phones, announced (sr-only) on desktop. */}
      <p
        aria-live="polite"
        className={`text-sm text-muted-foreground md:sr-only ${
          isFiltering && cedears.length > 0 ? "-mt-[var(--space-xs)]" : "sr-only"
        }`}
      >
        {isFiltering && cedears.length > 0
          ? `${filtered.length} ${filtered.length === 1 ? "resultado" : "resultados"} en ${cedears.length} CEDEARs`
          : ""}
      </p>

      {toolbarOnlyUntilData && cedears.length === 0 ? null : filtered.length === 0 ? (
        <Empty className="rounded-[var(--radius-m)] border border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>Sin resultados</EmptyTitle>
            <EmptyDescription>
              No encontramos CEDEARs que coincidan con tu búsqueda.
              {query.trim() ? (
                <span className="block md:hidden">
                  Probá con el ticker (p. ej. AAPL) o parte del nombre de la empresa.
                </span>
              ) : null}
            </EmptyDescription>
          </EmptyHeader>
          <Button
            type="button"
            variant="outline"
            className="md:hidden"
            onClick={clearFilters}
          >
            {query.trim() ? "Borrar búsqueda" : "Quitar filtros"}
          </Button>
        </Empty>
      ) : (
        <div className="max-w-full overflow-x-auto rounded-[var(--radius-m)] border border-border">
          {tableCaption ? (
            <p
              className={`border-b border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground ${isFiltering ? "max-md:hidden" : ""}`}
            >
              {tableCaption}
            </p>
          ) : null}
          <Table className="ch-list md:min-w-[44rem]">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="w-10 px-1">
                  <span className="sr-only">Fijar</span>
                </TableHead>
                <TableHead className="min-w-24">Ticker</TableHead>
                <TableHead className="min-w-40">Empresa</TableHead>
                <TableHead className="min-w-24">Mercado</TableHead>
                <TableHead className="min-w-24 text-right">Precio</TableHead>
                <TableHead className="min-w-20 text-right">Var. %</TableHead>
                <TableHead className="min-w-16 text-right">Ratio</TableHead>
                <TableHead className="min-w-28 text-right">Ticker original</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map((c) => {
                const isPinned = visiblePins.includes(c.Cedears)
                const isSelected = selectedTicker === c.Cedears

                return (
                <TableRow
                  key={c.Cedears}
                  tabIndex={0}
                  data-state={isSelected ? "selected" : undefined}
                  aria-label={`Ver detalle de ${c.Cedears}`}
                  className={`cursor-pointer bg-card hover:bg-muted/50 ${isPinned ? "!bg-border/40 hover:!bg-border/60 border-l-2 border-l-foreground/20" : ""}`}
                  onClick={() => selectTicker(c.Cedears)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      selectTicker(c.Cedears)
                    }
                  }}
                >
                  <TableCell className="px-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={(event) => {
                        event.stopPropagation()
                        togglePin(c.Cedears)
                      }}
                      aria-label={
                        isPinned
                          ? `Quitar ${c.Cedears} de fijados`
                          : `Fijar ${c.Cedears} arriba`
                      }
                      className={
                        isPinned
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }
                    >
                      {isPinned ? <PinOffIcon /> : <PinIcon />}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <img
                        src={logoUrl(c.TickerOriginal)}
                        alt=""
                        width={16}
                        height={16}
                        className="size-4 shrink-0 rounded-sm bg-muted object-contain"
                        loading="lazy"
                      />
                      <Link
                        href={`/cedear/${c.Cedears}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          trackSelectTicker({ ticker: c.Cedears })
                        }}
                        className="font-mono font-medium underline-offset-4 hover:underline"
                      >
                        {c.Cedears}
                      </Link>
                    </span>
                  </TableCell>
                  <TableCell className={empresaCellClassName}>
                    <span className="block truncate" title={c.Name}>
                      {c.Name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{c.Market}</Badge>
                  </TableCell>
                  <TableCell className={numericCellClassName}>
                    {formatPrice(c.price)}
                  </TableCell>
                  <TableCell
                    className={`${numericCellClassName} ${pctChangeClassName(c.pctChange)}`}
                  >
                    {formatPctChange(c.pctChange)}
                  </TableCell>
                  <TableCell className={numericCellClassName}>
                    {c.Ratio}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {c.TickerOriginal}
                  </TableCell>
                </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {filtered.length > 0 && !(toolbarOnlyUntilData && cedears.length === 0) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline">
                  <FileTextIcon data-icon="inline-start" />
                  Markdown
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => copyToClipboard(toMarkdown(displayed), "Markdown")}
                >
                  <CopyIcon data-icon="inline-start" />
                  Copiar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    download(
                      toMarkdown(displayed),
                      "cedears.md",
                      "text/markdown",
                      "Markdown",
                    )
                  }
                >
                  <DownloadIcon data-icon="inline-start" />
                  Descargar
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline">
                  <TableIcon data-icon="inline-start" />
                  CSV
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => copyToClipboard(toCsv(displayed), "CSV")}
                >
                  <CopyIcon data-icon="inline-start" />
                  Copiar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    download(toCsv(displayed), "cedears.csv", "text/csv", "CSV")
                  }
                >
                  <DownloadIcon data-icon="inline-start" />
                  Descargar
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <CedearDetailSheet
        cedear={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTicker(null)
        }}
      />
    </div>
  )
}
