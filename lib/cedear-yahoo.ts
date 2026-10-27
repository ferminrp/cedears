import type { Cedear } from "@/lib/cedears"

export function cedearYahooSymbol(
  cedear: Pick<Cedear, "TickerOriginal" | "yahooSymbol">,
): string {
  const fromMetadata = cedear.yahooSymbol?.trim()
  if (fromMetadata) return fromMetadata
  return cedear.TickerOriginal.trim()
}
