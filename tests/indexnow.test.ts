import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  normalizeSitemapUrl,
  parseSitemapXml,
  urlsWithChangedLastmod,
} from '../lib/indexnow/sitemap.ts'
import { isIndexNowOkStatus } from '../lib/indexnow/submit.ts'

describe('indexnow sitemap', () => {
  it('normalizes trailing slashes', () => {
    assert.equal(
      normalizeSitemapUrl('https://cedears.com/cedear/AAPL/'),
      'https://cedears.com/cedear/AAPL',
    )
    assert.equal(normalizeSitemapUrl('https://cedears.com/'), 'https://cedears.com/')
  })

  it('parses loc and lastmod from url entries', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset>
  <url><loc>https://cedears.com/</loc><lastmod>2026-01-01T00:00:00.000Z</lastmod></url>
  <url><loc>https://cedears.com/cedear/AAPL</loc><lastmod>2026-01-02T00:00:00.000Z</lastmod></url>
</urlset>`
    const map = parseSitemapXml(xml)
    assert.equal(map.size, 2)
    assert.equal(
      map.get('https://cedears.com/'),
      '2026-01-01T00:00:00.000Z',
    )
    const bareHome = parseSitemapXml(
      '<url><loc>https://cedears.com</loc><lastmod>2026-02-01</lastmod></url>',
    )
    assert.equal(bareHome.get('https://cedears.com/'), '2026-02-01')
    assert.equal(map.get('https://cedears.com/cedear/AAPL'), '2026-01-02T00:00:00.000Z')
  })

  it('detects new and changed URLs by lastmod', () => {
    const before = new Map([
      ['https://cedears.com/', '2026-01-01T00:00:00.000Z'],
      ['https://cedears.com/cedear/AAPL', '2026-01-02T00:00:00.000Z'],
    ])
    const after = new Map([
      ['https://cedears.com/', '2026-01-02T00:00:00.000Z'],
      ['https://cedears.com/cedear/AAPL', '2026-01-02T00:00:00.000Z'],
      ['https://cedears.com/cedear/MSFT', '2026-01-03T00:00:00.000Z'],
    ])
    const changed = urlsWithChangedLastmod(before, after).sort()
    assert.deepEqual(changed, [
      'https://cedears.com/',
      'https://cedears.com/cedear/MSFT',
    ])
  })
})

describe('indexnow submit', () => {
  it('accepts 200 and 202', () => {
    assert.equal(isIndexNowOkStatus(200), true)
    assert.equal(isIndexNowOkStatus(202), true)
    assert.equal(isIndexNowOkStatus(400), false)
  })
})
