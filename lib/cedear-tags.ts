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

export function getUniqueTags(cedears: { tags: string[] }[]): string[] {
  const unique = new Set<string>()
  for (const cedear of cedears) {
    for (const tag of cedear.tags) {
      unique.add(tag)
    }
  }
  return [...unique].sort((a, b) => a.localeCompare(b, "es"))
}

export function findTagBySlug(tags: string[], slug: string): string | null {
  return tags.find((tag) => slugifyTag(tag) === slug) ?? null
}

/** All tags that share a slug (e.g. "Minería & Metales" and "Minería y metales"). */
export function findTagsBySlug(tags: string[], slug: string): string[] {
  return tags.filter((tag) => slugifyTag(tag) === slug)
}

/** Unique slug params for SSG — one entry per slug, preferring the first tag. */
export function getUniqueTagSlugs(cedears: { tags: string[] }[]): {
  tag: string
  slug: string
}[] {
  const bySlug = new Map<string, string>()
  for (const tag of getUniqueTags(cedears)) {
    const slug = slugifyTag(tag)
    if (!bySlug.has(slug)) {
      bySlug.set(slug, tag)
    }
  }
  return [...bySlug.entries()].map(([slug, tag]) => ({ tag, slug }))
}

export function categoryPath(tag: string): string {
  return `/categoria/${slugifyTag(tag)}`
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
