import { getSiteUrl } from '@/lib/site'

export const revalidate = 3600

export async function GET() {
  const siteUrl = getSiteUrl()
  const catalogUrl = `${siteUrl}/.well-known/api-catalog`
  const jsonUrl = `${siteUrl}/cedears.json`
  const csvUrl = `${siteUrl}/cedears.csv`

  const linkset = {
    linkset: [
      {
        anchor: catalogUrl,
        item: [
          { href: jsonUrl, type: 'application/json' },
          { href: csvUrl, type: 'text/csv' },
        ],
      },
      {
        anchor: jsonUrl,
        'service-desc': [],
        'service-doc': [
          { href: `${siteUrl}/llms.txt`, type: 'text/plain' },
          { href: `${siteUrl}/agent-instructions.md`, type: 'text/markdown' },
          { href: `${siteUrl}/cedears.md`, type: 'text/markdown' },
        ],
      },
    ],
  }

  return new Response(JSON.stringify(linkset), {
    headers: {
      'Content-Type':
        'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
      Link: `</.well-known/api-catalog>; rel="api-catalog", </cedears.json>; rel="item"; type="application/json", </llms.txt>; rel="service-doc"; type="text/plain", </agent-instructions.md>; rel="service-doc"; type="text/markdown", </cedears.md>; rel="service-doc"; type="text/markdown"`,
    },
  })
}
