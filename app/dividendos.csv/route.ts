import { getDividendsTableData, toDividendsCsv } from "@/lib/dividends"

export const revalidate = 86400

export async function GET() {
  try {
    const data = await getDividendsTableData()
    if (data.loadFailed) {
      return new Response("Error al cargar los datos", {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      })
    }
    return new Response(toDividendsCsv(data.rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="dividendos.csv"',
      },
    })
  } catch {
    return new Response("Error al cargar los datos", {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    })
  }
}
