import { getDividendsTableData, toDividendsCsv } from "@/lib/dividends"

export const revalidate = 86400

export async function GET() {
  try {
    const data = await getDividendsTableData()
    return new Response(toDividendsCsv(data.rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="dividendos.csv"',
      },
    })
  } catch {
    return new Response("Error al cargar los datos", { status: 500 })
  }
}
