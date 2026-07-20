import type { MetadataRoute } from "next"
import { getCedearBases } from "@/lib/get-cedears"
import { getSiteUrl } from "@/lib/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const bases = await getCedearBases()
  const now = new Date()

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/earnings`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...bases.map((cedear) => ({
      url: `${siteUrl}/cedear/${cedear.Cedears}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ]
}
