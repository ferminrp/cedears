import { getCedearQuotes } from "@/lib/get-cedears"

export const revalidate = 600

export async function GET() {
  try {
    const quotes = await getCedearQuotes()
    return Response.json(
      { fetchedAt: new Date().toISOString(), quotes },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=60",
        },
      },
    )
  } catch (error) {
    console.error("No se pudieron obtener cotizaciones de CEDEARs", error)
    const message =
      error instanceof Error ? error.message : "Error al cargar cotizaciones"
    const status = message.includes("HTTP") ? 502 : 500
    return Response.json({ error: message }, { status })
  }
}
