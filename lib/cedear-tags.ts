import { canonicalCategorySlug } from "@/lib/category-redirects"

export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "y")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Canonical category slug → raw `slugifyTag(tag)` values that belong to one theme.
 * Legacy slugs (e.g. `tech`) are merged into the canonical URL slug (see middleware 301).
 */
export const CATEGORY_TAG_SLUG_ALIASES: Readonly<
  Record<string, readonly string[]>
> = {
  tecnologia: ["tecnologia", "tech"],
  "cripto-y-bitcoin": ["cripto-y-bitcoin", "cripto"],
}

const PREFERRED_TAG_BY_CANONICAL_SLUG: Readonly<Record<string, string>> = {
  tecnologia: "Tecnología",
  "cripto-y-bitcoin": "Cripto & Bitcoin",
  "mineria-y-metales": "Minería & Metales",
}

export function resolveCategorySlug(slug: string): string {
  return canonicalCategorySlug(slug)
}

/** Canonical slug for a tag string (for hrefs and sitemap). */
export function canonicalTagSlugFromTag(tag: string): string {
  const raw = slugifyTag(tag)
  for (const [canonical, aliases] of Object.entries(CATEGORY_TAG_SLUG_ALIASES)) {
    if (aliases.includes(raw)) return canonical
  }
  return canonicalCategorySlug(raw)
}

function tagSlugAliasesForCategory(canonicalSlug: string): readonly string[] {
  const resolved = resolveCategorySlug(canonicalSlug)
  return CATEGORY_TAG_SLUG_ALIASES[resolved] ?? [resolved]
}

export function getUniqueTags(cedears: { tags: string[] }[]): string[] {
  const unique = new Set<string>()
  for (const cedear of cedears) {
    for (const tag of cedear.tags) {
      unique.add(tag)
    }
  }
  return [...unique].sort((a, b) => a.localeCompare(b, "es"))
}

export function findTagsBySlug(tags: string[], slug: string): string[] {
  const canonical = resolveCategorySlug(slug)
  const allowed = new Set(tagSlugAliasesForCategory(canonical))
  return tags.filter((tag) => allowed.has(slugifyTag(tag)))
}

export function findTagBySlug(tags: string[], slug: string): string | null {
  const matching = findTagsBySlug(tags, slug)
  if (matching.length === 0) return null

  const canonical = resolveCategorySlug(slug)
  const preferred = PREFERRED_TAG_BY_CANONICAL_SLUG[canonical]
  if (preferred && matching.includes(preferred)) return preferred

  return [...matching].sort((a, b) => a.localeCompare(b, "es"))[0]
}

/** Unique slug params for SSG — one entry per canonical slug. */
export function getUniqueTagSlugs(cedears: { tags: string[] }[]): {
  tag: string
  slug: string
}[] {
  const tags = getUniqueTags(cedears)
  const byCanonical = new Map<string, string>()

  for (const tag of tags) {
    const canonical = canonicalTagSlugFromTag(tag)
    if (!byCanonical.has(canonical)) {
      byCanonical.set(canonical, tag)
    }
  }

  for (const [canonical] of [...byCanonical.entries()]) {
    const preferred = PREFERRED_TAG_BY_CANONICAL_SLUG[canonical]
    const matching = findTagsBySlug(tags, canonical)
    if (preferred && matching.includes(preferred)) {
      byCanonical.set(canonical, preferred)
    } else if (matching.length > 0) {
      byCanonical.set(
        canonical,
        [...matching].sort((a, b) => a.localeCompare(b, "es"))[0],
      )
    }
  }

  return [...byCanonical.entries()].map(([slug, tag]) => ({ tag, slug }))
}

export function categoryPath(tag: string): string {
  return `/categoria/${canonicalTagSlugFromTag(tag)}`
}

export function categoryTitle(tag: string): string {
  return `CEDEARs de ${tag}`
}

export function categoryDescription(tag: string, count: number): string {
  return `Consultá ${count} CEDEARs de ${tag} con precios, ratios y datos actualizados en Argentina.`
}

export function categoriesIndexTitle(): string {
  return "Categorías de CEDEARs"
}

export function categoriesIndexDescription(categoryCount: number): string {
  return `Explorá ${categoryCount} categorías de empresas con CEDEAR en Argentina. Accedé a precios, ratios y datos actualizados por sector.`
}

const CATEGORY_PREVIEW_LOGO_LIMIT = 3

export function getCategoryIndex(
  cedears: { tags: string[]; TickerOriginal: string }[],
): {
  tag: string
  slug: string
  count: number
  href: string
  previewTickers: string[]
}[] {
  const tags = getUniqueTags(cedears)

  return getUniqueTagSlugs(cedears)
    .map(({ tag, slug }) => {
      const matchingTags = findTagsBySlug(tags, slug)
      const tagSet = new Set(matchingTags)
      const matchingCedears = cedears.filter((c) =>
        c.tags.some((t) => tagSet.has(t)),
      )
      const previewTickers = [
        ...new Set(matchingCedears.map((c) => c.TickerOriginal)),
      ].slice(0, CATEGORY_PREVIEW_LOGO_LIMIT)

      return {
        tag,
        slug,
        count: matchingCedears.length,
        href: categoryPath(tag),
        previewTickers,
      }
    })
    .sort((a, b) => a.tag.localeCompare(b.tag, "es"))
}

export function countCedearsForCategorySlug(
  cedears: { tags: string[] }[],
  slug: string,
): number {
  const tags = getUniqueTags(cedears)
  const matchingTags = findTagsBySlug(tags, slug)
  const tagSet = new Set(matchingTags)
  return cedears.filter((c) => c.tags.some((t) => tagSet.has(t))).length
}
