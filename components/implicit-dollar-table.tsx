"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"
import type { ImplicitDollarRow } from "@/lib/implicit-dollar"
import { logoUrl } from "@/lib/logo"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const compactFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
})

const numericCellClassName = "text-right font-mono tabular-nums"
const empresaCellClassName = "max-w-52 text-muted-foreground"

type SortKey = "implicitFx" | "tradedValue" | "ticker" | "volume"
type SortDir = "asc" | "desc"

function formatArs(value: number): string {
  return arsFormatter.format(value)
}

function formatCompact(value: number): string {
  return compactFormatter.format(value)
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
      className="inline-flex items-center gap-1 font-medium hover:text-foreground"
    >
      {label}
      <Icon className="size-3.5 opacity-60" />
    </button>
  )
}

export function ImplicitDollarTable({ rows }: { rows: ImplicitDollarRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("tradedValue")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir(
      key === "ticker" || key === "implicitFx" ? "asc" : "desc",
    )
  }

  const sorted = [...rows].sort((a, b) => {
    let cmp = 0
    if (sortKey === "implicitFx") {
      cmp = a.implicitFx - b.implicitFx
    } else if (sortKey === "tradedValue") {
      cmp = a.tradedValue - b.tradedValue
    } else if (sortKey === "volume") {
      cmp = (a.cedear.volume ?? 0) - (b.cedear.volume ?? 0)
    } else {
      cmp = a.cedear.Cedears.localeCompare(b.cedear.Cedears)
    }
    return sortDir === "asc" ? cmp : -cmp
  })

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table className="min-w-[44rem]">
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="min-w-24">
              <SortButton
                label="Ticker"
                active={sortKey === "ticker"}
                direction={sortDir}
                onClick={() => toggleSort("ticker")}
              />
            </TableHead>
            <TableHead className="hidden min-w-40 sm:table-cell">Empresa</TableHead>
            <TableHead className="min-w-28 text-right">
              <SortButton
                label="Dólar implícito"
                active={sortKey === "implicitFx"}
                direction={sortDir}
                onClick={() => toggleSort("implicitFx")}
              />
            </TableHead>
            <TableHead className="hidden min-w-24 text-right md:table-cell">
              <SortButton
                label="Volumen"
                active={sortKey === "volume"}
                direction={sortDir}
                onClick={() => toggleSort("volume")}
              />
            </TableHead>
            <TableHead className="min-w-28 text-right">
              <SortButton
                label="Vol. × precio"
                active={sortKey === "tradedValue"}
                direction={sortDir}
                onClick={() => toggleSort("tradedValue")}
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => (
            <TableRow key={row.cedear.Cedears} className="bg-card hover:bg-muted/50">
              <TableCell>
                <span className="flex items-center gap-1.5">
                  <img
                    src={logoUrl(row.cedear.TickerOriginal)}
                    alt=""
                    width={16}
                    height={16}
                    className="size-4 shrink-0 rounded-sm bg-muted object-contain"
                    loading="lazy"
                  />
                  <Link
                    href={`/cedear/${row.cedear.Cedears}`}
                    className="font-mono font-medium underline-offset-4 hover:underline"
                  >
                    {row.cedear.Cedears}
                  </Link>
                </span>
              </TableCell>
              <TableCell className={`hidden sm:table-cell ${empresaCellClassName}`}>
                <span className="block truncate" title={row.cedear.Name}>
                  {row.cedear.Name}
                </span>
              </TableCell>
              <TableCell className={numericCellClassName}>
                {formatArs(row.implicitFx)}
              </TableCell>
              <TableCell className={`hidden md:table-cell ${numericCellClassName}`}>
                {row.cedear.volume !== null ? formatCompact(row.cedear.volume) : "—"}
              </TableCell>
              <TableCell className={numericCellClassName}>
                {formatArs(row.tradedValue)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
