/** Legacy / duplicate category slugs → canonical slug (301 in middleware). */
export const CATEGORY_SLUG_REDIRECTS: Readonly<Record<string, string>> = {
  /** Duplicate of tag slug `tech` (59 CEDEARs); canonical `/categoria/tecnologia`. */
  tech: "tecnologia",
  /** Duplicate of `cripto-y-bitcoin`; legacy short URL. */
  cripto: "cripto-y-bitcoin",
  /** Duplicate of tag `Farma & Biotecnología`; canonical `/categoria/salud`. */
  "farma-y-biotecnologia": "salud",
}

export const LEGACY_CATEGORY_SLUGS = Object.keys(
  CATEGORY_SLUG_REDIRECTS,
) as (keyof typeof CATEGORY_SLUG_REDIRECTS)[]

export const NON_CANONICAL_CATEGORY_SLUGS = new Set(
  Object.keys(CATEGORY_SLUG_REDIRECTS),
)

export function canonicalCategorySlug(slug: string): string {
  return CATEGORY_SLUG_REDIRECTS[slug] ?? slug
}
