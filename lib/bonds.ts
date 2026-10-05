export type BondKind = "bono" | "letra"

export type Bond = {
  symbol: string
  /** Descripción corta inferida del ticker (data912 no publica nombres). */
  name: string
  kind: BondKind
  /** Cotización en ARS cada 100 nominales (convención de BYMA). */
  price: number
  pctChange: number | null
  volume: number | null
}

/** Los bonos y letras cotizan cada 100 valores nominales. */
export const BOND_QUOTE_BASIS = 100

const BOND_FAMILIES: { pattern: RegExp; name: string }[] = [
  { pattern: /^(AL|AE|AO|AN)\d\d$/, name: "Bonar en dólares (ley local)" },
  { pattern: /^GD\d\d$/, name: "Global en dólares (ley NY)" },
  { pattern: /^BPO[A-D]\d$/, name: "BOPREAL (BCRA)" },
  { pattern: /^(TX\d\d|TZX)/, name: "Boncer (ajusta por CER)" },
  { pattern: /^X\d\d[A-Z]\d$/, name: "Lecer (ajusta por CER)" },
  { pattern: /^(TZV|D\d\d[A-Z]\d$)/, name: "Dólar linked" },
  { pattern: /^TT[A-Z]\d\d$/, name: "Bono dual" },
  { pattern: /^TM[A-Z]\d\d$/, name: "Bono TAMAR" },
  { pattern: /^T\d\d[A-Z]\d$/, name: "Boncap (tasa fija)" },
  { pattern: /^S\d\d[A-Z]\d$/, name: "Lecap (tasa fija)" },
]

export function describeBond(symbol: string, kind: BondKind): string {
  const family = BOND_FAMILIES.find((f) => f.pattern.test(symbol))
  if (family) return family.name
  return kind === "letra" ? "Letra del Tesoro" : "Bono argentino"
}
