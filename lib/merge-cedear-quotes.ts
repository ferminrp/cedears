import type { Cedear } from "@/lib/cedears"

export type CedearQuote = {
  price: number | null
  pctChange: number | null
  volume: number | null
  usPrice: number | null
  priceMep: number | null
  priceCcl: number | null
}

export type CedearBase = Omit<Cedear, keyof CedearQuote>

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase()
}

export function emptyQuotes(bases: CedearBase[]): Cedear[] {
  return bases.map((c) => ({
    ...c,
    price: null,
    pctChange: null,
    volume: null,
    usPrice: null,
    priceMep: null,
    priceCcl: null,
  }))
}

export function mergeCedearQuotes(
  bases: CedearBase[],
  quotes: Record<string, CedearQuote> | null,
): Cedear[] {
  if (!quotes || Object.keys(quotes).length === 0) {
    return emptyQuotes(bases)
  }

  return bases.map((c) => {
    const quote = quotes[normalizeSymbol(c.Cedears)]
    return {
      ...c,
      price: quote?.price ?? null,
      pctChange: quote?.pctChange ?? null,
      volume: quote?.volume ?? null,
      usPrice: quote?.usPrice ?? null,
      priceMep: quote?.priceMep ?? null,
      priceCcl: quote?.priceCcl ?? null,
    }
  })
}
