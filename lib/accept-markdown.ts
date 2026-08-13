/**
 * Returns true when the client prefers text/markdown over text/html
 * per RFC 7231 content negotiation (q-values).
 */
export function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false

  const types = acceptHeader.split(',').map((part) => {
    const [type, ...params] = part.trim().split(';')
    const qParam = params.find((p) => p.trim().startsWith('q='))
    const q = qParam ? Number.parseFloat(qParam.split('=')[1]!) : 1
    return { type: type.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0 }
  })

  const markdown = types.find((t) => t.type === 'text/markdown')
  if (!markdown || markdown.q === 0) return false

  const htmlTypes = types.filter(
    (t) => t.type === 'text/html' || t.type === 'application/xhtml+xml',
  )
  if (htmlTypes.length === 0) return true

  const bestHtmlQ = Math.max(...htmlTypes.map((t) => t.q))
  return markdown.q >= bestHtmlQ
}
