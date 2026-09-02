import { getSiteUrl } from '@/lib/site'

export const revalidate = 3600

export async function GET() {
  const siteUrl = getSiteUrl()
  const catalogUrl = `${siteUrl}/.well-known/api-catalog`
  const jsonUrl = `${siteUrl}/cedears.json`
  const csvUrl = `${siteUrl}/cedears.csv`
  const mcpUrl = `${siteUrl}/mcp`

  const linkset = {
    linkset: [
      {
        anchor: catalogUrl,
        item: [
          { href: jsonUrl, type: 'application/json' },
          { href: csvUrl, type: 'text/csv' },
          { href: mcpUrl, type: 'application/json' },
        ],
      },
      {
        anchor: jsonUrl,
        'service-desc': [],
        'service-doc': [
          { href: `${siteUrl}/llms.txt`, type: 'text/plain' },
          { href: `${siteUrl}/cedears.md`, type: 'text/markdown' },
        ],
      },
      {
        anchor: mcpUrl,
        'service-desc': [
          { href: `${siteUrl}/.well-known/mcp.json`, type: 'application/json' },
        ],
        'service-doc': [{ href: `${siteUrl}/llms.txt`, type: 'text/plain' }],
      },
    ],
  }

  return new Response(JSON.stringify(linkset), {
    headers: {
      'Content-Type':
        'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
      Link: `</.well-known/api-catalog>; rel="api-catalog", </cedears.json>; rel="item"; type="application/json", </cedears.csv>; rel="item"; type="text/csv", </mcp>; rel="item"; type="application/json", </llms.txt>; rel="service-doc"; type="text/plain", </cedears.md>; rel="service-doc"; type="text/markdown"`,
    },
  })
}
