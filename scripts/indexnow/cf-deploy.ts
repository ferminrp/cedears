import { spawnSync } from 'node:child_process'
import { existsSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CEDEARS_SITEMAP_URL } from '@/lib/indexnow/config'
import { fetchSitemapXml } from '@/lib/indexnow/sitemap'

const beforePath = join(tmpdir(), `cedears-sitemap-before-${process.pid}.xml`)

async function snapshotLiveSitemap(): Promise<void> {
  try {
    const xml = await fetchSitemapXml(CEDEARS_SITEMAP_URL)
    writeFileSync(beforePath, xml, 'utf8')
    console.log(`[indexnow] Saved pre-deploy sitemap snapshot (${beforePath})`)
  } catch (error) {
    console.warn(
      '[indexnow] Skipping post-deploy ping: could not download live sitemap before deploy.',
      error instanceof Error ? error.message : error,
    )
  }
}

function runWranglerDeploy(): number {
  const result = spawnSync(
    'pnpm',
    ['exec', 'wrangler', 'deploy', '--config', 'dist/server/wrangler.json'],
    { stdio: 'inherit' },
  )
  return result.status ?? 1
}

function runPingChanged(): void {
  if (!existsSync(beforePath)) {
    console.log('[indexnow] No pre-deploy sitemap snapshot; skipping ping-changed.')
    return
  }

  const ping = spawnSync(
    process.execPath,
    [
      '--experimental-strip-types',
      '--import',
      './tests/register-ts.mjs',
      'scripts/indexnow/ping-changed.ts',
      beforePath,
    ],
    { stdio: 'inherit', cwd: process.cwd() },
  )

  if (ping.status !== 0) {
    console.warn(
      '[indexnow] ping-changed exited with code',
      ping.status,
      '(deploy succeeded; IndexNow notification skipped).',
    )
  }
}

function cleanupSnapshot(): void {
  if (existsSync(beforePath)) {
    try {
      unlinkSync(beforePath)
    } catch {
      // ignore
    }
  }
}

await snapshotLiveSitemap()

const deployStatus = runWranglerDeploy()

if (deployStatus === 0) {
  try {
    runPingChanged()
  } finally {
    cleanupSnapshot()
  }
} else {
  cleanupSnapshot()
  process.exit(deployStatus)
}
