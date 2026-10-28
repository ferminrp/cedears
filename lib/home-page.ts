import type { Cedear } from '@/lib/cedears'

/** Visible rows on home (HTML budget); full set via /categorias and A–Z index. */
export const HOME_TABLE_LIMIT = 100

export const HOME_PAGE_TITLE =
  'Listado de CEDEARs en Argentina: precios, ratios y cotización hoy'

export const HOME_PAGE_DESCRIPTION =
  'Listado de CEDEARs en Argentina con precios en pesos, ratios de conversión y cotización del día. Consultá los más operados y el índice A–Z con enlace a cada ficha.'

export const HOME_INTRO =
  'En esta página encontrás un listado de CEDEARs (Certificados de Depósito Argentinos) negociados en BYMA: precios en ARS, ratio y variación diaria de los más operados, más un índice A–Z con enlace a cada ticker. Para explorar el universo completo por temática, usá las categorías.'

export function compareCedearsByVolumeDesc(a: Cedear, b: Cedear): number {
  const va = a.volume ?? 0
  const vb = b.volume ?? 0
  if (vb !== va) return vb - va
  return a.Cedears.localeCompare(b.Cedears, 'es')
}

export function selectHomeTableCedears(cedears: Cedear[]): Cedear[] {
  return [...cedears].sort(compareCedearsByVolumeDesc).slice(0, HOME_TABLE_LIMIT)
}

export type TickerAzGroup = {
  letter: string
  tickers: string[]
}

export function buildTickerAzGroups(cedears: Cedear[]): TickerAzGroup[] {
  const byLetter = new Map<string, string[]>()

  for (const { Cedears: ticker } of cedears) {
    const first = ticker.charAt(0).toUpperCase()
    const letter = /[A-Z]/.test(first) ? first : '#'
    const list = byLetter.get(letter) ?? []
    list.push(ticker)
    byLetter.set(letter, list)
  }

  const letters = [...byLetter.keys()].sort((a, b) => {
    if (a === '#') return 1
    if (b === '#') return -1
    return a.localeCompare(b)
  })

  return letters.map((letter) => ({
    letter,
    tickers: (byLetter.get(letter) ?? []).sort((a, b) => a.localeCompare(b, 'es')),
  }))
}
