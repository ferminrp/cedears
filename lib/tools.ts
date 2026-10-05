import { type Cedear } from "@/lib/cedears"

const percentFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

const percentSignedFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
})

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—"
  return `${percentFormatter.format(value)}%`
}

export function formatSignedPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—"
  return `${percentSignedFormatter.format(value)} pp`
}

/**
 * Distinct, evenly spread color for donut segments. The site theme is
 * intentionally grayscale, but a composition chart needs separable slices,
 * so we generate harmonious HSL hues by index.
 */
export function donutColor(index: number): string {
  const hue = (index * 57) % 360
  return `hsl(${hue} 52% 55%)`
}

export type SelectedCedear = Pick<
  Cedear,
  "Cedears" | "Name" | "TickerOriginal" | "price"
>

/* ------------------------------------------------------------------ */
/* Rebalanceo                                                          */
/* ------------------------------------------------------------------ */

export type RebalanceInput = {
  cedear: SelectedCedear
  quantity: number
  targetPct: number
}

export type RebalanceRow = {
  ticker: string
  name: string
  tickerOriginal: string
  price: number | null
  quantity: number
  currentValue: number
  currentPct: number
  normalizedTargetPct: number
  targetValue: number
  deltaNominales: number
  newQuantity: number
  newValue: number
  newPct: number
}

export type RebalanceResult = {
  rows: RebalanceRow[]
  totalValue: number
  targetSum: number
  residualCash: number
  hasMissingPrices: boolean
}

export function computeRebalance(inputs: RebalanceInput[]): RebalanceResult {
  const priced = inputs.filter((i) => i.cedear.price !== null)
  const totalValue = priced.reduce(
    (acc, i) => acc + (i.cedear.price ?? 0) * Math.max(i.quantity, 0),
    0,
  )
  const targetSum = inputs.reduce((acc, i) => acc + Math.max(i.targetPct, 0), 0)
  const normFactor = targetSum > 0 ? targetSum : 1

  const base = inputs.map((input) => {
    const price = input.cedear.price
    const quantity = Math.max(input.quantity, 0)
    const targetPct = Math.max(input.targetPct, 0)
    const currentValue = price !== null ? price * quantity : 0
    const targetValue = totalValue * (targetPct / normFactor)
    const tradable = price !== null && price > 0
    return { input, price, quantity, targetPct, currentValue, targetValue, tradable }
  })

  const newQuantities = base.map((b) =>
    b.tradable && b.price !== null
      ? Math.max(b.quantity + Math.round((b.targetValue - b.currentValue) / b.price), 0)
      : b.quantity,
  )

  // Redondear cada operación por separado puede hacer que las compras cuesten
  // más de lo que entra por ventas. Mientras falte efectivo, sacamos de a un
  // nominal del activo que más se pasa de su objetivo.
  let cash =
    totalValue -
    base.reduce((acc, b, index) => acc + (b.price ?? 0) * newQuantities[index], 0)
  const EPSILON = 1e-6
  while (cash < -EPSILON) {
    let worst = -1
    let worstExcess = -Infinity
    base.forEach((b, index) => {
      if (!b.tradable || b.price === null || newQuantities[index] < 1) return
      const excess = newQuantities[index] * b.price - b.targetValue
      if (excess > worstExcess) {
        worst = index
        worstExcess = excess
      }
    })
    if (worst === -1) break
    newQuantities[worst] -= 1
    cash += base[worst].price ?? 0
  }

  // Con el efectivo que sobra, compramos de a un nominal del activo que más
  // lejos quede de su objetivo, mientras alcance y el nominal lo acerque al
  // objetivo (le falte al menos medio nominal).
  for (;;) {
    let best = -1
    let bestGap = 0
    base.forEach((b, index) => {
      if (!b.tradable || b.price === null || b.price > cash + EPSILON) return
      const gap = b.targetValue - newQuantities[index] * b.price
      if (gap >= b.price / 2 && gap > bestGap) {
        best = index
        bestGap = gap
      }
    })
    if (best === -1) break
    newQuantities[best] += 1
    cash -= base[best].price ?? 0
  }

  const rows: RebalanceRow[] = base.map((b, index) => {
    const newQuantity = newQuantities[index]
    const newValue = b.price !== null ? b.price * newQuantity : 0
    return {
      ticker: b.input.cedear.Cedears,
      name: b.input.cedear.Name,
      tickerOriginal: b.input.cedear.TickerOriginal,
      price: b.price,
      quantity: b.quantity,
      currentValue: b.currentValue,
      currentPct: totalValue > 0 ? (b.currentValue / totalValue) * 100 : 0,
      normalizedTargetPct: (b.targetPct / normFactor) * 100,
      targetValue: b.targetValue,
      deltaNominales: newQuantity - b.quantity,
      newQuantity,
      newValue,
      newPct: totalValue > 0 ? (newValue / totalValue) * 100 : 0,
    }
  })

  return {
    rows,
    totalValue,
    targetSum,
    residualCash: Math.max(cash, 0),
    hasMissingPrices: inputs.some((i) => i.cedear.price === null),
  }
}

/* Exportar / importar cartera ------------------------------------- */

export type PortfolioEntry = {
  ticker: string
  quantity: number
  targetPct: number
}

export type PortfolioCsvImport = {
  known: PortfolioEntry[]
  unknownTickers: string[]
}

/** Keep rows whose ticker is in `knownTickers`; collect the rest (order preserved). */
export function partitionPortfolioEntries(
  entries: PortfolioEntry[],
  knownTickers: ReadonlySet<string>,
): PortfolioCsvImport {
  const known: PortfolioEntry[] = []
  const unknownTickers: string[] = []
  for (const entry of entries) {
    if (knownTickers.has(entry.ticker)) known.push(entry)
    else unknownTickers.push(entry.ticker)
  }
  return { known, unknownTickers }
}

/* Persistencia de la calculadora en el navegador -------------------- */

export type RebalanceMode = "rebalance" | "accumulate"

/** Fila de la calculadora: el color es fijo por ticker aunque se reordene. */
export type RebalanceEntry = PortfolioEntry & { colorIndex: number }

/** Asigna colores consecutivos a entradas que todavía no tienen uno. */
export function withColorIndexes(entries: PortfolioEntry[]): RebalanceEntry[] {
  return entries.map((entry, index) => ({ ...entry, colorIndex: index }))
}

/** El primer color libre, para que un ticker nuevo no repita uno en uso. */
export function nextColorIndex(entries: RebalanceEntry[]): number {
  const used = new Set(entries.map((e) => e.colorIndex))
  let index = 0
  while (used.has(index)) index++
  return index
}

export type SavedRebalanceState = {
  rows: RebalanceEntry[]
  mode: RebalanceMode
  contribution: number
}

const REBALANCE_STORAGE_KEY = "cedears-rebalance-state"

function nonNegative(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0
}

export function readRebalanceState(): SavedRebalanceState | null {
  if (typeof window === "undefined") return null

  try {
    const raw = localStorage.getItem(REBALANCE_STORAGE_KEY)
    if (raw === null) return null
    const data: unknown = JSON.parse(raw)
    if (typeof data !== "object" || data === null) return null
    const record = data as Record<string, unknown>

    const rows: RebalanceEntry[] = []
    if (Array.isArray(record.rows)) {
      for (const row of record.rows) {
        if (typeof row !== "object" || row === null) continue
        const { ticker, quantity, targetPct, colorIndex } = row as Record<string, unknown>
        if (typeof ticker !== "string" || ticker.trim() === "") continue
        if (rows.some((r) => r.ticker === ticker)) continue
        const color =
          typeof colorIndex === "number" &&
          Number.isInteger(colorIndex) &&
          colorIndex >= 0 &&
          !rows.some((r) => r.colorIndex === colorIndex)
            ? colorIndex
            : nextColorIndex(rows)
        rows.push({
          ticker,
          quantity: nonNegative(quantity),
          targetPct: nonNegative(targetPct),
          colorIndex: color,
        })
      }
    }

    return {
      rows,
      mode: record.mode === "accumulate" ? "accumulate" : "rebalance",
      contribution: nonNegative(record.contribution),
    }
  } catch {
    return null
  }
}

export function writeRebalanceState(state: SavedRebalanceState): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(REBALANCE_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Almacenamiento lleno o bloqueado (modo privado): seguimos sin guardar.
  }
}

export const PORTFOLIO_CSV_HEADER = "ticker,nominales,objetivo_pct"

const HEADER_TICKERS = new Set(["TICKER", "CEDEAR", "SIMBOLO", "SÍMBOLO"])

function csvCell(value: string | number): string {
  const text = String(value)
  if (/[",\n\r;]/.test(text)) return `"${text.replaceAll('"', '""')}"`
  return text
}

export function portfolioToCsv(entries: PortfolioEntry[]): string {
  const rows = entries.map(
    (e) => `${csvCell(e.ticker)},${csvCell(e.quantity)},${csvCell(e.targetPct)}`,
  )
  return [PORTFOLIO_CSV_HEADER, ...rows].join("\n") + "\n"
}

function detectCsvSeparator(line: string): "," | ";" {
  let commas = 0
  let semicolons = 0
  let inQuotes = false
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (inQuotes) continue
    if (char === ",") commas++
    else if (char === ";") semicolons++
  }
  return semicolons > commas ? ";" : ","
}

function splitCsvLine(line: string, separator: "," | ";"): string[] {
  const cells: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === separator && !inQuotes) {
      cells.push(current)
      current = ""
      continue
    }
    current += char
  }
  cells.push(current)
  return cells
}

function parseCsvNumber(raw: string | undefined, separator: "," | ";"): number {
  if (!raw) return 0
  let clean = raw.replace(/[\s%]/g, "").trim()
  if (clean === "") return 0
  if (separator === ";") {
    clean = clean.replace(/\./g, "").replace(",", ".")
  }
  const n = Number(clean)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * Lee el CSV exportado. También tolera archivos re-guardados en Excel en
 * español (separador `;` y coma decimal), BOM UTF-8 y la ausencia de encabezado.
 * Filas del mismo ticker: queda la última.
 */
export function parsePortfolioCsv(text: string): PortfolioEntry[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "")
  if (lines.length === 0) return []

  const separator = detectCsvSeparator(lines[0])
  const byTicker = new Map<string, PortfolioEntry>()

  for (const line of lines) {
    const [rawTicker, rawQuantity, rawTarget] = splitCsvLine(line, separator)
    const ticker = rawTicker?.trim().replace(/^"|"$/g, "").toUpperCase()
    if (!ticker || HEADER_TICKERS.has(ticker)) continue
    byTicker.set(ticker, {
      ticker,
      quantity: parseCsvNumber(rawQuantity, separator),
      targetPct: parseCsvNumber(rawTarget, separator),
    })
  }
  return [...byTicker.values()]
}

export type AccumulationResult = RebalanceResult & {
  contribution: number
  invested: number
  /** Aporte mínimo para llegar al objetivo sin vender; null si es imposible. */
  requiredContribution: number | null
}

/**
 * Aporte mínimo para que ningún holding con peso > 0 quede por encima de su
 * objetivo, sin vender. `null` si un holding con valor tiene objetivo 0.
 */
export function requiredAccumulationContribution(
  inputs: RebalanceInput[],
): number | null {
  const totalValue = inputs.reduce(
    (acc, i) => acc + (i.cedear.price ?? 0) * Math.max(i.quantity, 0),
    0,
  )
  const targetSum = inputs.reduce((acc, i) => acc + Math.max(i.targetPct, 0), 0)
  if (targetSum <= 0) return null

  const weights = inputs.map((i) => Math.max(i.targetPct, 0) / targetSum)
  const values = inputs.map((i) => (i.cedear.price ?? 0) * Math.max(i.quantity, 0))
  if (values.some((value, index) => value > 0 && weights[index] === 0)) {
    return null
  }
  if (totalValue <= 0) return 0

  const requiredTotal = Math.max(
    ...weights.map((weight, index) =>
      weight > 0 ? values[index] / weight : 0,
    ),
  )
  return Math.max(requiredTotal - totalValue, 0)
}

/**
 * Rebalanceo solo con compras: reparte un aporte nuevo entre los CEDEARs
 * que quedan por debajo de su objetivo (calculado sobre cartera + aporte),
 * en proporción a cuánto les falta. Nunca vende.
 */
export function computeAccumulation(
  inputs: RebalanceInput[],
  contribution: number,
): AccumulationResult {
  const safeContribution = Math.max(contribution, 0)
  const EPSILON = 1e-6
  const totalValue = inputs.reduce(
    (acc, i) => acc + (i.cedear.price ?? 0) * Math.max(i.quantity, 0),
    0,
  )
  const targetSum = inputs.reduce((acc, i) => acc + Math.max(i.targetPct, 0), 0)
  const normFactor = targetSum > 0 ? targetSum : 1
  const newTotal = totalValue + safeContribution

  const base = inputs.map((input) => {
    const price = input.cedear.price
    const quantity = Math.max(input.quantity, 0)
    const weight = Math.max(input.targetPct, 0) / normFactor
    const currentValue = price !== null ? price * quantity : 0
    const targetValue = newTotal * weight
    const buyable = price !== null && price > 0 && weight > 0
    return { input, price, quantity, weight, currentValue, targetValue, buyable }
  })

  const deficits = base.map((b) =>
    b.buyable ? Math.max(b.targetValue - b.currentValue, 0) : 0,
  )
  const deficitSum = deficits.reduce((acc, d) => acc + d, 0)

  const bought = base.map((b, index) => {
    if (!b.buyable || b.price === null) return 0
    const allocation =
      deficitSum > EPSILON
        ? safeContribution * (deficits[index] / deficitSum)
        : 0
    return Math.floor(allocation / b.price)
  })

  let leftover =
    safeContribution -
    bought.reduce((acc, n, index) => acc + n * (base[index].price ?? 0), 0)
  for (;;) {
    let best = -1
    let bestGap = 0
    base.forEach((b, index) => {
      if (!b.buyable || b.price === null || b.price > leftover + EPSILON) return
      const heldValue = (b.quantity + bought[index]) * b.price
      const gap = b.targetValue - heldValue
      if (gap > EPSILON && gap > bestGap) {
        best = index
        bestGap = gap
      }
    })
    if (best === -1) break
    bought[best] += 1
    leftover -= base[best].price ?? 0
  }

  leftover = Math.max(leftover, 0)
  const invested = safeContribution - leftover
  const finalTotal = totalValue + invested

  const rows: RebalanceRow[] = base.map((b, index) => {
    const newQuantity = b.quantity + bought[index]
    const newValue = b.price !== null ? b.price * newQuantity : 0
    return {
      ticker: b.input.cedear.Cedears,
      name: b.input.cedear.Name,
      tickerOriginal: b.input.cedear.TickerOriginal,
      price: b.price,
      quantity: b.quantity,
      currentValue: b.currentValue,
      currentPct: totalValue > 0 ? (b.currentValue / totalValue) * 100 : 0,
      normalizedTargetPct: b.weight * 100,
      targetValue: b.targetValue,
      deltaNominales: bought[index],
      newQuantity,
      newValue,
      newPct: finalTotal > 0 ? (newValue / finalTotal) * 100 : 0,
    }
  })

  return {
    rows,
    totalValue,
    targetSum,
    residualCash: leftover,
    hasMissingPrices: inputs.some((i) => i.cedear.price === null),
    contribution: safeContribution,
    invested,
    requiredContribution: requiredAccumulationContribution(inputs),
  }
}

/* ------------------------------------------------------------------ */
/* DCA                                                                 */
/* ------------------------------------------------------------------ */

export type DcaInput = {
  cedear: SelectedCedear
  targetPct: number
}

export type DcaRow = {
  ticker: string
  name: string
  tickerOriginal: string
  price: number | null
  normalizedTargetPct: number
  budget: number
  nominales: number
  invested: number
  actualPct: number
  deviation: number
}

export type DcaResult = {
  rows: DcaRow[]
  amount: number
  totalInvested: number
  leftover: number
  targetSum: number
  hasMissingPrices: boolean
}

export function computeDca(amount: number, inputs: DcaInput[]): DcaResult {
  const safeAmount = Math.max(amount, 0)
  const targetSum = inputs.reduce((acc, i) => acc + Math.max(i.targetPct, 0), 0)
  const normFactor = targetSum > 0 ? targetSum : 1

  const partial = inputs.map((input) => {
    const price = input.cedear.price
    const targetPct = Math.max(input.targetPct, 0)
    const normalizedTargetPct = (targetPct / normFactor) * 100
    const budget = safeAmount * (targetPct / normFactor)
    const nominales =
      price !== null && price > 0 ? Math.floor(budget / price) : 0
    const invested = price !== null ? nominales * price : 0

    return {
      ticker: input.cedear.Cedears,
      name: input.cedear.Name,
      tickerOriginal: input.cedear.TickerOriginal,
      price,
      normalizedTargetPct,
      budget,
      nominales,
      invested,
    }
  })

  const totalInvested = partial.reduce((acc, r) => acc + r.invested, 0)

  const rows: DcaRow[] = partial.map((r) => {
    const actualPct = totalInvested > 0 ? (r.invested / totalInvested) * 100 : 0
    return {
      ...r,
      actualPct,
      deviation: actualPct - r.normalizedTargetPct,
    }
  })

  return {
    rows,
    amount: safeAmount,
    totalInvested,
    leftover: safeAmount - totalInvested,
    targetSum,
    hasMissingPrices: inputs.some((i) => i.cedear.price === null),
  }
}
