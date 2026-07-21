import { yahooFinance } from "@/lib/yahoo-finance"

export type UnderlyingCompanyProfile = {
  ticker: string
  quoteType: string | null
  sector: string | null
  industry: string | null
  description: string | null
  website: string | null
  country: string | null
  employees: number | null
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase()
}

function parseProfile(
  ticker: string,
  summary: Awaited<ReturnType<typeof yahooFinance.quoteSummary>>,
): UnderlyingCompanyProfile | null {
  const profile = summary.assetProfile ?? summary.summaryProfile
  if (!profile) return null

  const sector = profile.sectorDisp ?? profile.sector ?? null
  const industry = profile.industryDisp ?? profile.industry ?? null
  const description = profile.longBusinessSummary ?? null
  const website = profile.website ?? null
  const country = profile.country ?? null
  const employees =
    typeof profile.fullTimeEmployees === "number" &&
    Number.isFinite(profile.fullTimeEmployees)
      ? profile.fullTimeEmployees
      : null

  if (!sector && !industry && !description && !website && !country && employees === null) {
    return null
  }

  return {
    ticker,
    quoteType: summary.quoteType?.quoteType ?? null,
    sector,
    industry,
    description,
    website,
    country,
    employees,
  }
}

export async function getUnderlyingProfile(
  ticker: string,
): Promise<UnderlyingCompanyProfile | null> {
  const normalized = normalizeTicker(ticker)
  if (!normalized) return null

  try {
    const summary = await yahooFinance.quoteSummary(normalized, {
      modules: ["assetProfile", "summaryProfile", "quoteType"],
    })
    return parseProfile(normalized, summary)
  } catch (error) {
    console.error("No se pudo obtener el perfil de Yahoo Finance", {
      ticker: normalized,
      error,
    })
    return null
  }
}
