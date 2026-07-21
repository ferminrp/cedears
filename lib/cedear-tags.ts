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

export function categoryPath(tag: string): string {
  return `/categoria/${slugifyTag(tag)}`
}

export function categoryTitle(tag: string): string {
  return `CEDEARs de ${tag}`
}

export function categoryDescription(tag: string, count: number): string {
  return `Consultá ${count} CEDEARs de ${tag} con precios, ratios y datos actualizados en Argentina.`
}
