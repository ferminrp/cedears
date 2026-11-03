import { canonicalCategorySlug } from "@/lib/category-redirects"
import { getUniqueTagSlugs } from "@/lib/cedear-tags"
import { getCedearBases } from "@/lib/get-cedears"

let cachedSlugs: { set: Set<string>; expiresAt: number } | null = null
const CACHE_MS = 5 * 60 * 1000

async function getKnownCategorySlugSet(): Promise<Set<string>> {
  const now = Date.now()
  if (cachedSlugs && cachedSlugs.expiresAt > now) {
    return cachedSlugs.set
  }
  const bases = await getCedearBases()
  const set = new Set(
    getUniqueTagSlugs(bases).map(({ slug }) => canonicalCategorySlug(slug)),
  )
  cachedSlugs = { set, expiresAt: now + CACHE_MS }
  return set
}

export async function isKnownCategorySlug(slug: string): Promise<boolean> {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) return false
  const canonical = canonicalCategorySlug(normalized)
  try {
    const set = await getKnownCategorySlugSet()
    return set.has(canonical)
  } catch {
    return true
  }
}
