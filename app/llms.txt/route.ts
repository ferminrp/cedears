import { getSiteUrl, siteConfig } from '@/lib/site'

export const revalidate = 3600

export async function GET() {
  const siteUrl = getSiteUrl()

  const body = [
    `# ${siteConfig.name}`,
    '',
    `> ${siteConfig.description}`,
    '',
    'Listado gratuito y actualizado de CEDEARs (Certificados de Depósito Argentinos) cotizados en BYMA, con precios en vivo, ratios y primas MEP/CCL.',
    '',
    '## Datos',
    '',
    `- [Listado completo (Markdown)](${siteUrl}/cedears.md): tabla GFM con ticker, empresa, mercado, ratio, ticker original, precio ARS, variación %, volumen, precio US, precio MEP, precio CCL, precio justo USD, prima % y tags`,
    `- [Listado completo (CSV)](${siteUrl}/cedears.csv): mismas columnas en CSV UTF-8`,
    `- [MCP](${siteUrl}/mcp): MCP público sin autenticación (streamable-http JSON-RPC: initialize, tools/list, tools/call). Tools: list_cedears, get_cedear, earnings. Discovery: ${siteUrl}/.well-known/mcp.json`,
    '',
    '## Páginas',
    '',
    `- [Inicio](${siteUrl}/): buscador y tabla filtrable de CEDEARs`,
    `- [Categorías](${siteUrl}/categorias): CEDEARs agrupados por tags`,
    `- [Dólar MEP](${siteUrl}/dolar-mep): tipo de cambio implícito MEP por CEDEAR`,
    `- [Dólar cable](${siteUrl}/dolar-cable): tipo de cambio implícito CCL por CEDEAR`,
    `- [Earnings](${siteUrl}/earnings): calendario de resultados de subyacentes`,
    `- [Portfolio](${siteUrl}/portfolio): seguimiento de tenencias`,
    `- [Herramientas](${siteUrl}/herramientas): rebalanceo y DCA`,
    `- [ALyCs](${siteUrl}/alycs): comisiones de brokers para operar CEDEARs`,
    '',
  ].join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
