import { readFileSync } from 'node:fs'
import { pingChangedSinceSitemapXml } from '@/lib/indexnow/submit'

const beforePath = process.argv[2]

if (!beforePath) {
  console.error('Usage: node scripts/indexnow/ping-changed.ts <path-to-sitemap-before.xml>')
  process.exit(1)
}

let previousXml: string
try {
  previousXml = readFileSync(beforePath, 'utf8')
} catch (error) {
  console.error(`Could not read pre-deploy sitemap at ${beforePath}:`, error)
  process.exit(1)
}

try {
  await pingChangedSinceSitemapXml(previousXml)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
