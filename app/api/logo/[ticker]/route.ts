import { logoDevUpstreamUrl } from "@/lib/logo"

export const revalidate = 2592000

export async function GET(
  _request: Request,
  context: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await context.params
  const decodedTicker = decodeURIComponent(ticker).trim()

  if (!decodedTicker) {
    return new Response(null, { status: 400 })
  }

  const upstream = await fetch(logoDevUpstreamUrl(decodedTicker), {
    next: { revalidate: 2592000 },
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
