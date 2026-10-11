import { submitAllFromLiveSitemap } from '@/lib/indexnow/submit'

try {
  await submitAllFromLiveSitemap()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
