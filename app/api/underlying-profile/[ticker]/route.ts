import { getUnderlyingProfile } from "@/lib/underlying-profile"

export const revalidate = 86400

export async function GET(
  _request: Request,
  context: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await context.params
  const decodedTicker = decodeURIComponent(ticker).trim()

  if (!decodedTicker) {
    return Response.json({ error: "Ticker inválido" }, { status: 400 })
  }

  const profile = await getUnderlyingProfile(decodedTicker)

  if (!profile) {
    return Response.json(null, {
      status: 404,
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    })
  }

  return Response.json(profile, {
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  })
}
