import {
  CEDEARS_SITEMAP_URL,
  INDEXNOW_API_URL,
  INDEXNOW_HOST,
  INDEXNOW_KEY,
  INDEXNOW_KEY_LOCATION,
} from '@/lib/indexnow/config'
import {
  fetchSitemapXml,
  parseSitemapXml,
  urlsWithChangedLastmod,
} from '@/lib/indexnow/sitemap'

export function isIndexNowOkStatus(status: number): boolean {
  return status === 200 || status === 202
}

export async function verifyIndexNowKeyFile(): Promise<void> {
  const response = await fetch(INDEXNOW_KEY_LOCATION)
  if (!response.ok) {
    throw new Error(
      `Key file check failed: ${response.status} ${response.statusText} (${INDEXNOW_KEY_LOCATION})`,
    )
  }
  const body = (await response.text()).trim()
  if (body !== INDEXNOW_KEY) {
    throw new Error(
      `Key file body mismatch at ${INDEXNOW_KEY_LOCATION} (expected ${INDEXNOW_KEY.length} chars)`,
    )
  }
}

export async function postIndexNow(urlList: string[]): Promise<number> {
  if (urlList.length === 0) {
    console.log('IndexNow: no URLs to submit')
    return 200
  }

  const response = await fetch(INDEXNOW_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: INDEXNOW_HOST,
      key: INDEXNOW_KEY,
      keyLocation: INDEXNOW_KEY_LOCATION,
      urlList,
    }),
  })

  const detail = await response.text()
  console.log(
    `IndexNow: ${response.status} ${response.statusText}${detail ? ` — ${detail.slice(0, 200)}` : ''}`,
  )
  console.log(`IndexNow: submitted ${urlList.length} URL(s)`)

  return response.status
}

export async function submitAllFromLiveSitemap(): Promise<number> {
  await verifyIndexNowKeyFile()
  const xml = await fetchSitemapXml(CEDEARS_SITEMAP_URL)
  const entries = parseSitemapXml(xml)
  const urlList = [...entries.keys()]
  const status = await postIndexNow(urlList)
  if (!isIndexNowOkStatus(status)) {
    throw new Error(`IndexNow submit-all failed with status ${status}`)
  }
  return status
}

export async function pingChangedSinceSitemapXml(
  previousSitemapXml: string,
): Promise<number> {
  const before = parseSitemapXml(previousSitemapXml)
  const afterXml = await fetchSitemapXml(CEDEARS_SITEMAP_URL)
  const after = parseSitemapXml(afterXml)
  const changed = urlsWithChangedLastmod(before, after)

  if (changed.length === 0) {
    console.log('IndexNow: no URLs with changed lastmod since pre-deploy sitemap')
    return 200
  }

  await verifyIndexNowKeyFile()
  const status = await postIndexNow(changed)
  if (!isIndexNowOkStatus(status)) {
    throw new Error(`IndexNow ping-changed failed with status ${status}`)
  }
  return status
}
