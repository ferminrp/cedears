import { toMarkdownDocument } from '@/lib/cedears'
import { getCedears } from '@/lib/get-cedears'

export const revalidate = 60

export async function GET() {
  try {
    const cedears = await getCedears()
    return new Response(toMarkdownDocument(cedears), {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        // No `Vary: Accept` here: the middleware already adds it to the public
        // response, and vinext 1.x skips Workers Cache for any custom Vary.
      },
    })
  } catch {
    return new Response('Error al cargar los datos', { status: 500 })
  }
}
