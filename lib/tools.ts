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

  let allocatedNewValue = 0

  const rows: RebalanceRow[] = inputs.map((input) => {
    const price = input.cedear.price
    const quantity = Math.max(input.quantity, 0)
    const targetPct = Math.max(input.targetPct, 0)
    const currentValue = price !== null ? price * quantity : 0
    const normalizedTargetPct = (targetPct / normFactor) * 100
    const targetValue = totalValue * (targetPct / normFactor)

    let deltaNominales = 0
    let newQuantity = quantity

    if (price !== null && price > 0) {
      deltaNominales = Math.round((targetValue - currentValue) / price)
      newQuantity = Math.max(quantity + deltaNominales, 0)
      deltaNominales = newQuantity - quantity
    }

    const newValue = price !== null ? price * newQuantity : 0
    allocatedNewValue += newValue

    return {
      ticker: input.cedear.Cedears,
      name: input.cedear.Name,
      tickerOriginal: input.cedear.TickerOriginal,
      price,
      quantity,
      currentValue,
      currentPct: totalValue > 0 ? (currentValue / totalValue) * 100 : 0,
      normalizedTargetPct,
      targetValue,
      deltaNominales,
      newQuantity,
      newValue,
      newPct: totalValue > 0 ? (newValue / totalValue) * 100 : 0,
    }
  })

  return {
    rows,
    totalValue,
    targetSum,
    residualCash: totalValue - allocatedNewValue,
    hasMissingPrices: inputs.some((i) => i.cedear.price === null),
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
