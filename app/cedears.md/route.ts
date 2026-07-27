import { toMarkdownDocument } from '@/lib/cedears'
import { getCedears } from '@/lib/get-cedears'

export const revalidate = 60

export async function GET() {
  try {
    const cedears = await getCedears()
    return new Response(toMarkdownDocument(cedears), {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    })
  } catch {
    return new Response('Error al cargar los datos', { status: 500 })
  }
}
