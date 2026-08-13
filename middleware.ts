import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prefersMarkdown } from '@/lib/accept-markdown'

export function middleware(request: NextRequest) {
  const accept = request.headers.get('accept')

  if (request.nextUrl.pathname === '/' && prefersMarkdown(accept)) {
    const url = request.nextUrl.clone()
    url.pathname = '/cedears.md'
    return NextResponse.rewrite(url)
  }

  const response = NextResponse.next()
  response.headers.append('Vary', 'Accept')
  return response
}

export const config = {
  matcher: '/',
}
