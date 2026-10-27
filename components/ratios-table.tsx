"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"
import { type Cedear, formatArs, parseRatio } from "@/lib/cedears"
import { logoUrl } from "@/lib/logo"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const numericCellClassName = "text-right font-mono tabular-nums"
const empresaCellClassName = "max-w-[9rem] text-muted-foreground sm:max-w-52"

type SortKey = "ticker" | "name" | "ratio" | "price"
type SortDir = "asc" | "desc"

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

function compareNullableNumber(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return a - b
}

export function RatiosTable({ cedears }: { cedears: Cedear[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("ticker")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir(key === "price" || key === "ratio" ? "desc" : "asc")
  }

  const sorted = [...cedears].sort((a, b) => {
    let cmp = 0
    if (sortKey === "ticker") {
      cmp = a.Cedears.localeCompare(b.Cedears)
    } else if (sortKey === "name") {
      cmp = a.Name.localeCompare(b.Name)
    } else if (sortKey === "ratio") {
      cmp = compareNullableNumber(parseRatio(a.Ratio), parseRatio(b.Ratio))
    } else if (sortKey === "price") {
      cmp = compareNullableNumber(a.price, b.price)
    }
    return sortDir === "asc" ? cmp : -cmp
  })

  return (
    <div className="overflow-x-auto rounded-[var(--radius-m)] border border-border">
      <Table className="w-full min-w-[20rem]">
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="min-w-[4.5rem]">
              <SortButton
                label="Ticker"
                active={sortKey === "ticker"}
                direction={sortDir}
                onClick={() => toggleSort("ticker")}
              />
            </TableHead>
            <TableHead className="min-w-[5rem]">
              <SortButton
                label="Empresa"
                active={sortKey === "name"}
                direction={sortDir}
                onClick={() => toggleSort("name")}
              />
            </TableHead>
            <TableHead className="min-w-[3.5rem] text-right">
              <SortButton
                label="Ratio"
                active={sortKey === "ratio"}
                direction={sortDir}
                onClick={() => toggleSort("ratio")}
              />
            </TableHead>
            <TableHead className="min-w-[5rem] text-right">
              <SortButton
                label="Precio"
                active={sortKey === "price"}
                direction={sortDir}
                onClick={() => toggleSort("price")}
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((c) => (
            <TableRow key={c.Cedears} className="bg-card hover:bg-muted/50">
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
                    className="font-mono text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {c.Cedears}
                  </Link>
                </span>
              </TableCell>
              <TableCell className={empresaCellClassName}>
                <span className="block truncate text-sm" title={c.Name}>
                  {c.Name}
                </span>
              </TableCell>
              <TableCell className={`${numericCellClassName} text-sm`}>
                {c.Ratio}:1
              </TableCell>
              <TableCell className={`${numericCellClassName} text-sm`}>
                {formatArs(c.price)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
