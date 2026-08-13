import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prefersMarkdown } from '@/lib/accept-markdown'

export function middleware(request: NextRequest) {
  const accept = request.headers.get('accept')
  const pathname = request.nextUrl.pathname

  if (pathname === '/.well-known/api-catalog') {
    const url = request.nextUrl.clone()
    url.pathname = '/api-catalog'
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
    '</.well-known/api-catalog>; rel="api-catalog", </cedears.json>; rel="item"; type="application/json", </llms.txt>; rel="service-doc"; type="text/plain", </cedears.md>; rel="service-doc"; type="text/markdown"',
  )
  return response
}

export const config = {
  matcher: ['/', '/.well-known/api-catalog'],
}
