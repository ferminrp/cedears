import type { CedearBase } from "@/lib/get-cedears"

export function buildCedearTickerSet(bases: CedearBase[]): Set<string> {
  return new Set(bases.map((c) => c.Cedears.trim().toUpperCase()))
}
