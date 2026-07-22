const FINNHUB_COMPANY_NEWS_URL = "https://finnhub.io/api/v1/company-news"
const MAX_NEWS_ITEMS = 8

export type CompanyNewsItem = {
  id: number
  headline: string
  summary: string
  source: string
  datetime: number
  url: string
  image?: string
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function formatUtcDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getDateWindow(): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - 7)
  return {
    from: formatUtcDate(from),
    to: formatUtcDate(to),
  }
}

function parseCompanyNewsItem(value: unknown): CompanyNewsItem | null {
  if (!isRecord(value)) return null

  const id = value.id
  const headline = value.headline
  const summary = value.summary
  const source = value.source
  const datetime = value.datetime
  const url = value.url
  const image = value.image

  if (
    typeof id !== "number" ||
    !Number.isFinite(id) ||
    typeof headline !== "string" ||
    !headline ||
    typeof summary !== "string" ||
    typeof source !== "string" ||
    !source ||
    typeof datetime !== "number" ||
    !Number.isFinite(datetime) ||
    typeof url !== "string" ||
    !url
  ) {
    return null
  }

  return {
    id,
    headline,
    summary,
    source,
    datetime,
    url,
    ...(typeof image === "string" && image ? { image } : {}),
  }
}

export async function getCompanyNews(symbol: string): Promise<CompanyNewsItem[]> {
  const normalized = normalizeSymbol(symbol)
  if (!normalized) return []

  const apiKey = process.env.FINNHUB_API_KEY?.trim()
  if (!apiKey) return []

  const { from, to } = getDateWindow()

  try {
    const url = new URL(FINNHUB_COMPANY_NEWS_URL)
    url.searchParams.set("symbol", normalized)
    url.searchParams.set("from", from)
    url.searchParams.set("to", to)
    url.searchParams.set("token", apiKey)

    const res = await fetch(url, {
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const data: unknown = await res.json()
    if (!Array.isArray(data)) {
      throw new Error("Respuesta de noticias inválida")
    }

    return data
      .map(parseCompanyNewsItem)
      .filter((item): item is CompanyNewsItem => item !== null)
      .sort((a, b) => b.datetime - a.datetime)
      .slice(0, MAX_NEWS_ITEMS)
  } catch (error) {
    console.error("No se pudieron obtener las noticias de Finnhub", {
      symbol: normalized,
      error,
    })
    return []
  }
}
