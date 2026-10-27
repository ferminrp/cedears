import type { Cedear } from "@/lib/cedears"

export type CedearIdentity = Pick<
  Cedear,
  "Name" | "Cedears" | "TickerOriginal" | "Ratio"
>

export function cedearCompanyLabel(cedear: CedearIdentity): string {
  const name = cedear.Name.trim()
  if (name) return name
  const original = cedear.TickerOriginal.trim()
  if (original) return original
  return cedear.Cedears
}

export function buildCedearDetailTitle(
  cedear: CedearIdentity,
  paysDividends: boolean,
): string {
  const empresa = cedearCompanyLabel(cedear)
  let title = `CEDEAR de ${empresa} (${cedear.Cedears}): precio hoy, ratio ${cedear.Ratio}:1`
  if (paysDividends) {
    title += " y dividendos"
  }
  return title
}
