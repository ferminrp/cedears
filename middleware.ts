import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prefersMarkdown } from '@/lib/accept-markdown'
import { CATEGORY_SLUG_REDIRECTS } from '@/lib/category-redirects'

function requestHost(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    request.nextUrl.host
  )
    .split(',')[0]
    .trim()
}

function siteOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (configured) return configured
  const host = requestHost(request).replace(/^www\./, '')
  return `https://${host}`
}

function permanentRedirect(url: URL): NextResponse {
  return NextResponse.redirect(url, 301)
}

function absoluteRedirect(request: NextRequest, pathname: string): NextResponse {
  const target = new URL(pathname, siteOrigin(request))
  target.search = request.nextUrl.search
  return permanentRedirect(target)
}

function redirectToHttps(request: NextRequest): NextResponse | null {
  const proto = request.headers.get('x-forwarded-proto')
  if (proto !== 'http') return null
  return absoluteRedirect(request, request.nextUrl.pathname)
}

function redirectWwwToApex(request: NextRequest): NextResponse | null {
  const host = requestHost(request)
  if (!host.startsWith('www.')) return null
  return absoluteRedirect(request, request.nextUrl.pathname)
}

function redirectCedearTickerCase(request: NextRequest): NextResponse | null {
  const match = /^\/cedear\/([^/]+)\/?$/.exec(request.nextUrl.pathname)
  if (!match) return null
  const raw = match[1]
  const upper = raw.toUpperCase()
  if (raw === upper) return null
  return absoluteRedirect(request, `/cedear/${upper}`)
}

function redirectCategorySlug(request: NextRequest): NextResponse | null {
  const match = /^\/categoria\/([^/]+)\/?$/.exec(request.nextUrl.pathname)
  if (!match) return null
  const slug = match[1]
  const target = CATEGORY_SLUG_REDIRECTS[slug]
  if (!target) return null
  return absoluteRedirect(request, `/categoria/${target}`)
}

export function middleware(request: NextRequest) {
  const accept = request.headers.get('accept')
  const pathname = request.nextUrl.pathname

  for (const redirect of [
    () => redirectToHttps(request),
    () => redirectWwwToApex(request),
    () => redirectCedearTickerCase(request),
    () => redirectCategorySlug(request),
  ]) {
    const res = redirect()
    if (res) return res
  }

  if (pathname === '/.well-known/api-catalog') {
    const url = request.nextUrl.clone()
    url.pathname = '/api-catalog'
    return NextResponse.rewrite(url)
  }

  if (pathname === '/.well-known/mcp.json') {
    const url = request.nextUrl.clone()
    url.pathname = '/mcp-well-known'
    return NextResponse.rewrite(url)
  }

  if (pathname === '/' && prefersMarkdown(accept)) {
    const url = request.nextUrl.clone()
    url.pathname = '/cedears.md'
    return NextResponse.rewrite(url)
  }

  const response = NextResponse.next()
  response.headers.append('Vary', 'Accept')
  response.headers.append(
    'Link',
    '</.well-known/api-catalog>; rel="api-catalog", </cedears.json>; rel="item"; type="application/json", </cedears.csv>; rel="item"; type="text/csv", </mcp>; rel="item"; type="application/json", </llms.txt>; rel="service-doc"; type="text/plain", </cedears.md>; rel="service-doc"; type="text/markdown"',
  )
  return response
}

export const config = {
  matcher: ['/', '/:path*'],
}
