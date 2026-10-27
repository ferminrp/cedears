import { cache } from "react"
import { yahooFinance } from "@/lib/yahoo-finance"

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase()
}

function hasPositiveDividend(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0
}

export const getUnderlyingPaysDividends = cache(async function getUnderlyingPaysDividends(
  ticker: string,
): Promise<boolean | null> {
  const normalized = normalizeTicker(ticker)
  if (!normalized) return null

  try {
    const summary = await yahooFinance.quoteSummary(normalized, {
      modules: ["summaryDetail"],
    })
    const detail = summary.summaryDetail
    if (!detail) return null

    const pays =
      hasPositiveDividend(detail.dividendRate) ||
      hasPositiveDividend(detail.trailingAnnualDividendRate) ||
      hasPositiveDividend(detail.dividendYield) ||
      hasPositiveDividend(detail.trailingAnnualDividendYield)

    return pays
  } catch (error) {
    console.error("No se pudo obtener dividendos de Yahoo Finance", {
      ticker: normalized,
      error,
    })
    return null
  }
})
