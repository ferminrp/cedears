import { getCedears, toCsv } from '@/lib/cedears'

export const revalidate = 60

export async function GET() {
  try {
    const cedears = await getCedears()
    return new Response(toCsv(cedears), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
      },
    })
  } catch {
    return new Response('Error al cargar los datos', { status: 500 })
  }
}
