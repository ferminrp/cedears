import {
  findTagsBySlug,
  getUniqueTags,
  slugifyTag,
} from "@/lib/cedear-tags"
import type { Cedear } from "@/lib/cedears"

export function getPrimaryCedearTag(cedear: Pick<Cedear, "tags">): string | null {
  const tag = cedear.tags[0]?.trim()
  return tag ? tag : null
}

export function getSimilarCedears(
  current: Cedear,
  all: Cedear[],
  limit = 8,
): Cedear[] {
  const primary = getPrimaryCedearTag(current)
  if (!primary) return []

  const allTags = getUniqueTags(all)
  const matchingTags = findTagsBySlug(allTags, slugifyTag(primary))
  if (matchingTags.length === 0) return []

  const tagSet = new Set(matchingTags)
  const currentTicker = current.Cedears.trim().toUpperCase()

  return all
    .filter(
      (c) =>
        c.Cedears.trim().toUpperCase() !== currentTicker &&
        c.tags.some((t) => tagSet.has(t)),
    )
    .sort((a, b) => a.Cedears.localeCompare(b.Cedears, "es"))
    .slice(0, limit)
}
