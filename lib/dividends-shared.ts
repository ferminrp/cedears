import type { DividendFrequencyLabel } from "@/lib/dividend-display"
import { parseRatio } from "@/lib/cedears"

export function estimatedAnnualUsdPerCedear(
  rate: number | null,
  ratio: string,
): number | null {
  if (rate === null) return null
  const ratioValue = parseRatio(ratio)
  if (ratioValue === null) return null
  return rate / ratioValue
}

export type CedearDividendRow = {
  cedear: string
  name: string
  market: string
  tickerOriginal: string
  ratio: string
  dividendYield: number | null
  dividendRateUsd: number | null
  estimatedCedearUsd: number | null
  frequency: DividendFrequencyLabel
  exDividendDate: string | null
  dividendPaymentDate: string | null
}

export type DividendsTableData = {
  rows: CedearDividendRow[]
  asOfDate: string
  loadFailed: boolean
}

export function compareByExDateAsc(a: CedearDividendRow, b: CedearDividendRow): number {
  const exA = a.exDividendDate ?? "9999-12-31"
  const exB = b.exDividendDate ?? "9999-12-31"
  const aMissing = a.exDividendDate === null
  const bMissing = b.exDividendDate === null
  if (aMissing && !bMissing) return 1
  if (!aMissing && bMissing) return -1
  if (exA !== exB) return exA.localeCompare(exB)
  return a.cedear.localeCompare(b.cedear)
}

export function filterDividendRows(
  rows: CedearDividendRow[],
  query: string,
): CedearDividendRow[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return rows
  return rows.filter(
    (row) =>
      row.cedear.toLowerCase().includes(normalized) ||
      row.name.toLowerCase().includes(normalized) ||
      row.tickerOriginal.toLowerCase().includes(normalized),
  )
}

export function filterDividendRowsByFrequency(
  rows: CedearDividendRow[],
  frequencyFilter: string | null,
): CedearDividendRow[] {
  if (!frequencyFilter || frequencyFilter === "todas") return rows
  if (frequencyFilter === "semestral-anual") {
    return rows.filter(
      (row) => row.frequency === "Semestral" || row.frequency === "Anual",
    )
  }
  const map: Record<string, DividendFrequencyLabel> = {
    mensual: "Mensual",
    trimestral: "Trimestral",
  }
  const target = map[frequencyFilter]
  if (!target) return rows
  return rows.filter((row) => row.frequency === target)
}

export function toDividendsCsv(rows: CedearDividendRow[]): string {
  const header =
    "Ticker,Empresa,Subyacente,Ratio,Yield,Frecuencia,ExDate,Pago,CobroEstimadoUSD\n"
  const lines = rows.map((row) => {
    const fields = [
      row.cedear,
      row.name,
      row.tickerOriginal,
      row.ratio,
      row.dividendYield !== null ? String(row.dividendYield) : "",
      row.frequency ?? "",
      row.exDividendDate ?? "",
      row.dividendPaymentDate ?? "",
      row.estimatedCedearUsd !== null ? String(row.estimatedCedearUsd) : "",
    ]
    return fields
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",")
  })
  return header + lines.join("\n") + "\n"
}

export const DIVIDENDOS_PAGE_TITLE =
  "CEDEARs que pagan dividendos: yield y próximas fechas | CEDEARs Argentina"

export const DIVIDENDOS_PAGE_H1 = "CEDEARs que pagan dividendos"

export const DIVIDENDOS_INTRO =
  "Yield, frecuencia y próximas fechas de los subyacentes que pagan dividendos."

export const DIVIDENDOS_META_DESCRIPTION =
  "Lista de CEDEARs que pagan dividendos con yield, frecuencia y próximas fechas ex-dividendo y de pago. Cómo se cobran en Argentina."

export const DIVIDENDOS_HOW_IT_WORKS = [
  "El dividendo lo paga la empresa o el fondo en el exterior y llega en dólares a tu cuenta en la ALyC, en proporción a tu tenencia y al ratio del CEDEAR.",
  "Para cobrarlo tenés que tener el CEDEAR en cartera antes de la fecha ex-dividendo del subyacente.",
  "En origen (por ejemplo, Estados Unidos) suele aplicarse una retención típica del 30% sobre el dividendo bruto; el neto que ves en cuenta depende de tu situación y del broker.",
  "En Argentina, el tratamiento impositivo depende de tu caso: consultá con tu contador.",
  "Esto no es asesoramiento legal, impositivo ni financiero.",
] as const

export const DIVIDENDOS_FAQ = [
  {
    question: "¿Qué es la fecha ex-dividendo?",
    answer:
      "Es la fecha a partir de la cual quien compra el activo ya no tiene derecho al próximo dividendo. Para cobrarlo en un CEDEAR, tenés que figurar como tenedor antes de esa fecha (según las reglas de tu ALyC).",
  },
  {
    question: "¿En qué moneda cobro?",
    answer:
      "El flujo habitual es en dólares en tu cuenta local en Argentina, proporcional a la cantidad de CEDEARs y al ratio. No recibís la acción en el exterior.",
  },
  {
    question: "¿Cuánto cobro por CEDEAR?",
    answer:
      "De forma estimada, el dividendo anual en USD del subyacente dividido el ratio del CEDEAR (ver columna «Cobro est.»). El monto real por evento depende del calendario de pagos y de retenciones. Consultá también la tabla de ratios.",
  },
] as const
