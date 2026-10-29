import { cache } from "react"
import {
  countDividendsInLast12Months,
  formatDateInEastern,
  inferFrequencyFromPaymentCount,
  pickUpcomingIsoDate,
  type DividendFrequencyLabel,
  yahooDateToIsoDate,
} from "@/lib/dividend-display"
import { yahooFinance } from "@/lib/yahoo-finance"

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase()
}

export type UnderlyingDividends = {
  yield: number | null
  rate: number | null
  exDate: string | null
  payDate: string | null
  frequency: DividendFrequencyLabel
}

async function fetchUnderlyingDividends(
  ticker: string,
): Promise<UnderlyingDividends | null> {
  const normalized = normalizeTicker(ticker)
  if (!normalized) return null

  try {
    const todayIso = formatDateInEastern(new Date())
    const [summary, chart] = await Promise.all([
      yahooFinance.quoteSummary(normalized, {
        modules: ["summaryDetail", "calendarEvents"],
      }),
      yahooFinance.chart(normalized, {
        period1: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400),
        events: "dividends",
      }),
    ])

    const detail = summary.summaryDetail
    const calendar = summary.calendarEvents

    const yieldValue =
      typeof detail?.dividendYield === "number" &&
      Number.isFinite(detail.dividendYield) &&
      detail.dividendYield > 0
        ? detail.dividendYield
        : typeof detail?.trailingAnnualDividendYield === "number" &&
            Number.isFinite(detail.trailingAnnualDividendYield) &&
            detail.trailingAnnualDividendYield > 0
          ? detail.trailingAnnualDividendYield
          : null

    const rate =
      typeof detail?.dividendRate === "number" &&
      Number.isFinite(detail.dividendRate) &&
      detail.dividendRate > 0
        ? detail.dividendRate
        : typeof detail?.trailingAnnualDividendRate === "number" &&
            Number.isFinite(detail.trailingAnnualDividendRate) &&
            detail.trailingAnnualDividendRate > 0
          ? detail.trailingAnnualDividendRate
          : null

    const dividendHistoryIso = (chart.events?.dividends ?? [])
      .map((entry) => yahooDateToIsoDate(entry.date))
      .filter((d): d is string => Boolean(d))

    const paymentCount = countDividendsInLast12Months(
      dividendHistoryIso,
      todayIso,
    )

    const exDate = pickUpcomingIsoDate(
      [
        yahooDateToIsoDate(detail?.exDividendDate),
        yahooDateToIsoDate(calendar?.exDividendDate),
      ],
      todayIso,
    )

    const payDate = pickUpcomingIsoDate(
      [yahooDateToIsoDate(calendar?.dividendDate)],
      todayIso,
    )

    return {
      yield: yieldValue,
      rate,
      exDate,
      payDate,
      frequency: inferFrequencyFromPaymentCount(paymentCount),
    }
  } catch (error) {
    console.error("No se pudo obtener dividendos de Yahoo Finance", {
      ticker: normalized,
      error,
    })
    return null
  }
}

export const getUnderlyingDividends = cache(fetchUnderlyingDividends)

export const getUnderlyingPaysDividends = cache(async function getUnderlyingPaysDividends(
  ticker: string,
): Promise<boolean | null> {
  const data = await getUnderlyingDividends(ticker)
  if (data === null) return null
  return data.yield !== null && data.yield > 0
})
