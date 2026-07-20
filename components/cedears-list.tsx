"use client"

import { useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"
import type { Cedear } from "@/lib/cedears"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

export function CedearsList({ cedears }: { cedears: Cedear[] }) {
  const [query, setQuery] = useState("")
  const [market, setMarket] = useState(ALL_MARKETS)

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

        <div className="flex items-center gap-3">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Ticker</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Mercado</TableHead>
                <TableHead className="text-right">Ratio</TableHead>
                <TableHead className="text-right">Ticker original</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.Cedears}>
                  <TableCell>
                    <span className="font-mono font-medium">{c.Cedears}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.Name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{c.Market}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
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
    </div>
  )
}
