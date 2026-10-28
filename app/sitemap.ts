import type { MetadataRoute } from "next"
import { categoryPath, getUniqueTagSlugs } from "@/lib/cedear-tags"
import { NON_CANONICAL_CATEGORY_SLUGS } from "@/lib/category-redirects"
import { getCedearBases } from "@/lib/get-cedears"
import {
  categoryLastModified,
  cedearLastModified,
  dataFeedLastModified,
  staticRouteLastModified,
} from "@/lib/sitemap-lastmod"
import { getSiteUrl } from "@/lib/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  let bases: Awaited<ReturnType<typeof getCedearBases>> = []
  try {
    bases = await getCedearBases()
  } catch {
    // Keep static routes when the remote list is unavailable.
  }

  const feedLastMod = bases.length > 0 ? dataFeedLastModified(bases) : staticRouteLastModified("/")

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: feedLastMod,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/cedears.md`,
      lastModified: feedLastMod,
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: `${siteUrl}/cedears.csv`,
      lastModified: feedLastMod,
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: `${siteUrl}/llms.txt`,
      lastModified: staticRouteLastModified("/llms.txt"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/dolar-mep`,
      lastModified: staticRouteLastModified("/dolar-mep"),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/dolar-cable`,
      lastModified: staticRouteLastModified("/dolar-cable"),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/ratios`,
      lastModified: feedLastMod,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/earnings`,
      lastModified: staticRouteLastModified("/earnings"),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/dividendos`,
      lastModified: staticRouteLastModified("/dividendos"),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/categorias`,
      lastModified: staticRouteLastModified("/categorias"),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/herramientas`,
      lastModified: staticRouteLastModified("/herramientas"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/alycs`,
      lastModified: staticRouteLastModified("/alycs"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/herramientas/rebalanceo`,
      lastModified: staticRouteLastModified("/herramientas/rebalanceo"),
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${siteUrl}/herramientas/dca`,
      lastModified: staticRouteLastModified("/herramientas/dca"),
      changeFrequency: "weekly",
      priority: 0.75,
    },
  ]

  const categoryEntries = getUniqueTagSlugs(bases)
    .filter(({ slug }) => !NON_CANONICAL_CATEGORY_SLUGS.has(slug))
    .map(({ tag }) => ({
      url: `${siteUrl}${categoryPath(tag)}`,
      lastModified: categoryLastModified(bases, tag),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }))

  const cedearEntries = bases.map((cedear) => ({
    url: `${siteUrl}/cedear/${cedear.Cedears}`,
    lastModified: cedearLastModified(cedear),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...categoryEntries, ...cedearEntries]
}
