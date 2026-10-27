import { toRatiosCsv } from "@/lib/ratios"
import { getCedears } from "@/lib/get-cedears"

export const revalidate = 60

export async function GET() {
  try {
    const cedears = await getCedears()
    return new Response(toRatiosCsv(cedears), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="ratios.csv"',
      },
    })
  } catch {
    return new Response("Error al cargar los datos", { status: 500 })
  }
}
