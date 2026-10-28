const CANONICAL_LINK_RE =
  /<link[^>]+rel=["']canonical["'][^>]*>/i

export function extractCanonicalHref(html: string): string | null {
  const match = html.match(
    /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i,
  )
  if (match) return match[1]
  const alt = html.match(
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i,
  )
  return alt?.[1] ?? null
}

export function isCanonicalInHead(html: string): boolean {
  const hrefPos = html.search(CANONICAL_LINK_RE)
  if (hrefPos === -1) return false
  const headEnd = html.indexOf("</head>")
  return headEnd !== -1 && hrefPos < headEnd
}
