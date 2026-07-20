"use client"

import { useMemo, useState } from "react"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  CopyIcon,
  DownloadIcon,
  FileTextIcon,
  SearchIcon,
  TableIcon,
} from "lucide-react"
import { toast } from "sonner"
import { type Cedear, toCsv, toMarkdown } from "@/lib/cedears"
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

const ALL_MARKETS = "all"
const DEFAULT_SORT = "default"
const PCT_SORT_ASC = "pct-asc"
const PCT_SORT_DESC = "pct-desc"

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

function formatPrice(value: number | null): string {
  if (value === null) return "—"
  return priceFormatter.format(value)
}

function formatPctChange(value: number | null): string {
  if (value === null) return "—"
  return `${pctFormatter.format(value)}%`
}

function pctChangeClassName(value: number | null): string {
  if (value === null || value === 0) return "text-muted-foreground"
  if (value > 0) return "text-emerald-600 dark:text-emerald-400"
  return "text-red-600 dark:text-red-400"
}

const numericCellClassName = "text-right font-mono tabular-nums"
const empresaCellClassName = "max-w-52 text-muted-foreground"

export function CedearsList({ cedears }: { cedears: Cedear[] }) {
  const [query, setQuery] = useState("")
  const [market, setMarket] = useState(ALL_MARKETS)
  const [pctSort, setPctSort] = useState<PctSort>(DEFAULT_SORT)

  const markets = useMemo(() => {
    const set = new Set(cedears.map((c) => c.Market).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [cedears])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cedears.filter((c) => {
      const matchesMarket = market === ALL_MARKETS || c.Market === market
      const matchesQuery =
        q === "" ||
        c.Cedears.toLowerCase().includes(q) ||
        c.Name.toLowerCase().includes(q) ||
        c.TickerOriginal.toLowerCase().includes(q)
      return matchesMarket && matchesQuery
    })
  }, [cedears, query, market])

  const displayed = useMemo(() => {
    if (pctSort === DEFAULT_SORT) return filtered

    const direction = pctSort === PCT_SORT_ASC ? "asc" : "desc"
    return [...filtered].sort((a, b) =>
      comparePctChange(a.pctChange, b.pctChange, direction),
    )
  }, [filtered, pctSort])

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por ticker o nombre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Buscar CEDEARs"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={market} onValueChange={setMarket}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Filtrar por mercado">
              <SelectValue placeholder="Mercado">
                {(value: string) =>
                  value === ALL_MARKETS ? "Todos los mercados" : value
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

          <Select value={pctSort} onValueChange={(value) => setPctSort(value as PctSort)}>
            <SelectTrigger className="w-full sm:w-56" aria-label="Ordenar por variación">
              <SelectValue placeholder="Ordenar">
                {(value: string) => {
                  if (value === PCT_SORT_DESC) return "Var. % mayor a menor"
                  if (value === PCT_SORT_ASC) return "Var. % menor a mayor"
                  return "Sin ordenar"
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

      <p className="text-sm text-muted-foreground">
        {filtered.length} de {cedears.length} CEDEARs
      </p>

      {filtered.length === 0 ? (
        <Empty className="rounded-lg border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>Sin resultados</EmptyTitle>
            <EmptyDescription>
              No encontramos CEDEARs que coincidan con tu búsqueda.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="w-28">Ticker</TableHead>
                <TableHead className="w-52">Empresa</TableHead>
                <TableHead>Mercado</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Var. %</TableHead>
                <TableHead className="text-right">Ratio</TableHead>
                <TableHead className="text-right">Ticker original</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map((c) => (
                <TableRow key={c.Cedears}>
                  <TableCell>
                    <span className="font-mono font-medium">{c.Cedears}</span>
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {filtered.length > 0 && (
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
    </div>
  )
}
