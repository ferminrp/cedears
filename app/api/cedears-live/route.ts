import { getCedears } from "@/lib/get-cedears"

// Same cadence as the home page: the interactive list replaces the SSR rows with
// this payload, so it must carry the same live quotes (/cedears.json is the
// public base listing and has no prices).
export const revalidate = 300

export async function GET() {
  try {
    const cedears = await getCedears()
    return Response.json(cedears, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "X-Robots-Tag": "noindex",
      },
    })
  } catch {
    return Response.json({ error: "Error al cargar los datos" }, { status: 500 })
  }
}
