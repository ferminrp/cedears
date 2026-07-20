import type { MetadataRoute } from "next"
import { getCedearBases } from "@/lib/get-cedears"
import { getSiteUrl } from "@/lib/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  let bases: Awaited<ReturnType<typeof getCedearBases>> = []
  try {
    bases = await getCedearBases()
  } catch {
    // Keep static routes when the remote list is unavailable.
  }
  const now = new Date()

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/dolar-mep`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/dolar-cable`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
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
