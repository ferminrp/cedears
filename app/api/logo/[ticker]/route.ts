import { logoDevUpstreamUrl } from "@/lib/logo"

// Binary image responses must not use ISR or fetch-level text caching (vinext
// stores fetch cache bodies via response.text(), which corrupts WebP bytes).
export const dynamic = "force-dynamic"

function logoDevReferer(request: Request): string {
  const fromRequest = request.headers.get("referer")
  if (fromRequest) return fromRequest

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cedears.com"
  return `${siteUrl.replace(/\/$/, "")}/`
}

export async function GET(
  request: Request,
  context: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await context.params
  const decodedTicker = decodeURIComponent(ticker).trim()

  if (!decodedTicker) {
    return new Response(null, { status: 400 })
  }

  const upstream = await fetch(logoDevUpstreamUrl(decodedTicker), {
    headers: {
      Referer: logoDevReferer(request),
    },
    cache: "no-store",
  })

  if (!upstream.ok) {
    return new Response(null, {
      status: upstream.status,
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    })
  }

  const body = await upstream.arrayBuffer()
  const contentType = upstream.headers.get("content-type") ?? "image/webp"

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=2592000, stale-while-revalidate=86400, immutable",
    },
  })
}
