import { getSiteUrl } from '@/lib/site'

export const revalidate = 3600

export async function GET() {
  const siteUrl = getSiteUrl()

  const body = [
    '# Content Signals (https://contentsignals.org / draft-romm-aipref-contentsignals)',
    '# search: indexación clásica (links + snippets)',
    '# ai-input: uso en tiempo real (RAG / grounding / respuestas generativas)',
    '# ai-train: entrenamiento o fine-tuning de modelos',
    'User-agent: *',
    'Content-Signal: search=yes, ai-train=no, ai-input=yes',
    'Allow: /',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
