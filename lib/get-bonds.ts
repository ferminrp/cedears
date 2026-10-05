import { cache } from "react"
import { unstable_cache } from "next/cache"
import { type Bond, type BondKind, describeBond } from "@/lib/bonds"

const BOND_SOURCES: { url: string; kind: BondKind }[] = [
  { url: "https://data912.com/live/arg_bonds", kind: "bono" },
  { url: "https://data912.com/live/arg_notes", kind: "letra" },
]

type RawQuote = {
  symbol: string
  c: number
  pct_change: number | null
  v: number | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function parseRawQuote(value: unknown): RawQuote | null {
  if (!isRecord(value) || typeof value.symbol !== "string") return null
  const c = finiteOrNull(value.c)
  if (c === null) return null
  return {
    symbol: value.symbol.trim().toUpperCase(),
    c,
    pct_change: finiteOrNull(value.pct_change),
    v: finiteOrNull(value.v),
  }
}

async function getRawQuotes(url: string): Promise<RawQuote[]> {
  const res = await fetch(url, {
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`No se pudo obtener precios de bonos (HTTP ${res.status})`)
  }

  const data: unknown = await res.json()
  if (!Array.isArray(data)) {
    throw new Error("Respuesta de precios de bonos inválida")
  }

  return data.map(parseRawQuote).filter((q): q is RawQuote => q !== null)
}

/**
 * data912 lista cada especie en pesos y también sus variantes en dólar MEP
 * (sufijo D) y cable (sufijo C). La calculadora trabaja en pesos, así que
 * descartamos las variantes en dólares: las que tienen la especie base en la
 * lista, vienen de a pares C/D o tienen un ticker propio (LK1QD, PAY0D) con
 * precio en dólares. Las pocas especies en pesos que terminan en D (BA37D,
 * SA24D) cotizan en decenas de miles de pesos cada 100 VN.
 */
const USD_PRICE_CEILING = 1000

function isUsdVariant(quote: RawQuote, symbols: Set<string>): boolean {
  const { symbol } = quote
  const suffix = symbol.at(-1)
  if (suffix !== "C" && suffix !== "D") return false
  const base = symbol.slice(0, -1)
  return (
    symbols.has(base) ||
    symbols.has(base + (suffix === "C" ? "D" : "C")) ||
    quote.c < USD_PRICE_CEILING
  )
}

async function loadBonds(): Promise<Bond[]> {
  const results = await Promise.allSettled(
    BOND_SOURCES.map((source) => getRawQuotes(source.url)),
  )

  const bonds: Bond[] = []
  results.forEach((result, index) => {
    const { kind, url } = BOND_SOURCES[index]
    if (result.status === "rejected") {
      console.error("No se pudieron obtener bonos de data912", { url, error: result.reason })
      return
    }

    const symbols = new Set(result.value.map((q) => q.symbol))
    for (const quote of result.value) {
      // Sin operaciones (c = 0) o precios en dólares sin especie base.
      if (quote.c < 1 || isUsdVariant(quote, symbols)) continue
      bonds.push({
        symbol: quote.symbol,
        name: describeBond(quote.symbol, kind),
        kind,
        price: quote.c,
        pctChange: quote.pct_change,
        volume: quote.v,
      })
    }
  })

  if (bonds.length === 0 && results.every((r) => r.status === "rejected")) {
    throw new Error("No se pudieron obtener precios de bonos")
  }

  return bonds.sort((a, b) => a.symbol.localeCompare(b.symbol))
}

const getBondsUncached = unstable_cache(loadBonds, ["bonds-live"], {
  revalidate: 300,
})

export const getBonds = cache(async (): Promise<Bond[]> => {
  return getBondsUncached()
})
