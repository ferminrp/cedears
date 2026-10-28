import type { CedearDividendRow } from "@/lib/dividends-shared"

export type DividendSortKey = "ticker" | "yield" | "exDate" | "payDate"
export type DividendSortDir = "asc" | "desc"

function compareNullableNumber(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return a - b
}

function compareIsoDateNullable(a: string | null, b: string | null): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return a.localeCompare(b)
}

/** Sort rows; null/missing dates and yields always last, in both directions. */
export function sortDividendRows(
  rows: CedearDividendRow[],
  sortKey: DividendSortKey,
  sortDir: DividendSortDir,
): CedearDividendRow[] {
  return [...rows].sort((a, b) => {
    let cmp = 0
    if (sortKey === "ticker") {
      cmp = a.cedear.localeCompare(b.cedear)
    } else if (sortKey === "yield") {
      cmp = compareNullableNumber(a.dividendYield, b.dividendYield)
    } else if (sortKey === "exDate") {
      cmp = compareIsoDateNullable(a.exDividendDate, b.exDividendDate)
    } else if (sortKey === "payDate") {
      cmp = compareIsoDateNullable(a.dividendPaymentDate, b.dividendPaymentDate)
    }

    if (cmp === 0) return a.cedear.localeCompare(b.cedear)

    const aMissing =
      sortKey === "yield"
        ? a.dividendYield === null
        : sortKey === "exDate"
          ? a.exDividendDate === null
          : sortKey === "payDate"
            ? a.dividendPaymentDate === null
            : false
    const bMissing =
      sortKey === "yield"
        ? b.dividendYield === null
        : sortKey === "exDate"
          ? b.exDividendDate === null
          : sortKey === "payDate"
            ? b.dividendPaymentDate === null
            : false

    if (aMissing || bMissing) return cmp

    return sortDir === "asc" ? cmp : -cmp
  })
}
