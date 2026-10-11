export function normalizeSitemapUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.pathname === '/' || parsed.pathname === '') {
      return `${parsed.origin}/`
    }
    parsed.pathname = parsed.pathname.replace(/\/$/, '')
    return parsed.toString()
  } catch {
    return url
  }
}

/** loc → lastmod (ISO string), when present */
export function parseSitemapXml(xml: string): Map<string, string | undefined> {
  const entries = new Map<string, string | undefined>()
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? []

  for (const block of urlBlocks) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim()
    if (!loc) continue
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim()
    entries.set(normalizeSitemapUrl(loc), lastmod)
  }

  return entries
}

export function urlsWithChangedLastmod(
  before: Map<string, string | undefined>,
  after: Map<string, string | undefined>,
): string[] {
  const changed: string[] = []

  for (const [loc, lastmod] of after) {
    const previous = before.get(loc)
    if (previous === undefined) {
      changed.push(loc)
      continue
    }
    if (lastmod !== previous) {
      changed.push(loc)
    }
  }

  return changed
}

export async function fetchSitemapXml(sitemapUrl: string): Promise<string> {
  const response = await fetch(sitemapUrl, {
    headers: { Accept: 'application/xml,text/xml,*/*' },
  })
  if (!response.ok) {
    throw new Error(`Sitemap fetch failed: ${response.status} ${response.statusText}`)
  }
  return response.text()
}
