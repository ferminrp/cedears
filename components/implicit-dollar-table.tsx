"use client"

import { useState } from "react"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"
import type { ImplicitDollarRow } from "@/lib/implicit-dollar"
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

type SortKey = "implicitFx" | "tradedValue" | "ticker"
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
  const [sortKey, setSortKey] = useState<SortKey>("implicitFx")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir(key === "ticker" ? "asc" : "asc")
  }

  const sorted = [...rows].sort((a, b) => {
    let cmp = 0
    if (sortKey === "implicitFx") {
      cmp = a.implicitFx - b.implicitFx
    } else if (sortKey === "tradedValue") {
      cmp = a.tradedValue - b.tradedValue
    } else {
      cmp = a.cedear.Cedears.localeCompare(b.cedear.Cedears)
    }
    return sortDir === "asc" ? cmp : -cmp
  })

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortButton
                label="Ticker"
                active={sortKey === "ticker"}
                direction={sortDir}
                onClick={() => toggleSort("ticker")}
              />
            </TableHead>
            <TableHead className="hidden sm:table-cell">Empresa</TableHead>
            <TableHead className="text-right">
              <SortButton
                label="Dólar implícito"
                active={sortKey === "implicitFx"}
                direction={sortDir}
                onClick={() => toggleSort("implicitFx")}
              />
            </TableHead>
            <TableHead className="hidden text-right md:table-cell">Volumen</TableHead>
            <TableHead className="text-right">
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
            <TableRow key={row.cedear.Cedears}>
              <TableCell className="font-mono text-sm">{row.cedear.Cedears}</TableCell>
              <TableCell className="hidden max-w-[12rem] truncate sm:table-cell">
                {row.cedear.Name}
              </TableCell>
              <TableCell className="text-right font-mono text-sm tabular-nums">
                {formatArs(row.implicitFx)}
              </TableCell>
              <TableCell className="hidden text-right font-mono text-sm tabular-nums md:table-cell">
                {row.cedear.volume !== null ? formatCompact(row.cedear.volume) : "—"}
              </TableCell>
              <TableCell className="text-right font-mono text-sm tabular-nums">
                {formatArs(row.tradedValue)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
