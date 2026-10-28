/** Legacy / duplicate category slugs → canonical slug (301 in middleware). */
export const CATEGORY_SLUG_REDIRECTS: Readonly<Record<string, string>> = {
  tech: "tecnologia",
  cripto: "cripto-y-bitcoin",
  "farma-y-biotecnologia": "salud",
}

export const NON_CANONICAL_CATEGORY_SLUGS = new Set(
  Object.keys(CATEGORY_SLUG_REDIRECTS),
)

export function canonicalCategorySlug(slug: string): string {
  return CATEGORY_SLUG_REDIRECTS[slug] ?? slug
}
