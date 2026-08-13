import { getCedearBases } from '@/lib/get-cedears'

export const revalidate = 86400

export async function GET() {
  try {
    const bases = await getCedearBases()
    return new Response(JSON.stringify(bases), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Error al cargar los datos' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  }
}
