#!/usr/bin/env node
/**
 * Builds data/nuevos-cedears-detected-at.json from the git history of
 * ferminrp/google-sheets-argento data/cedears.json (first commit where each
 * ticker appears). Merges current name/ratio from the live JSON feed.
 *
 * Env: ARGENTO_REPO — path to a local clone (default: shallow clone in os tmpdir).
 */

import { execSync } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, "..")
const OUT_PATH = join(REPO_ROOT, "data/nuevos-cedears-detected-at.json")
const DATA_URL =
  "https://raw.githubusercontent.com/ferminrp/google-sheets-argento/refs/heads/main/data/cedears.json?v=2"
const SOURCE_REPO = "https://github.com/ferminrp/google-sheets-argento"
const SOURCE_PATH = "data/cedears.json"

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts })
}

function ensureArgentoRepo() {
  if (process.env.ARGENTO_REPO) {
    return process.env.ARGENTO_REPO
  }
  const path = join(tmpdir(), "google-sheets-argento-generate")
  try {
    run(`git -C "${path}" rev-parse --is-inside-work-tree`)
  } catch {
    run(`git clone --filter=blob:none "${SOURCE_REPO}.git" "${path}"`)
  }
  run(`git -C "${path}" fetch origin main --quiet`)
  run(`git -C "${path}" checkout -q origin/main`)
  return path
}

function firstAppearanceDates(argentoRepo) {
  const lines = run(
    `git log --reverse --format=%H%x09%ci -- "${SOURCE_PATH}"`,
    { cwd: argentoRepo },
  )
    .trim()
    .split("\n")
    .filter(Boolean)

  const seen = new Map()
  for (const line of lines) {
    const tab = line.indexOf("\t")
    const hash = line.slice(0, tab)
    const date = line.slice(tab + 1)
    const isoDay = date.slice(0, 10)
    const raw = run(`git show ${hash}:${SOURCE_PATH}`, {
      cwd: argentoRepo,
      maxBuffer: 64 * 1024 * 1024,
    })
    const rows = JSON.parse(raw)
    if (!Array.isArray(rows)) continue
    for (const row of rows) {
      const ticker = String(row?.Cedears ?? "")
        .trim()
        .toUpperCase()
      if (ticker && !seen.has(ticker)) {
        seen.set(ticker, isoDay)
      }
    }
  }
  return seen
}

async function fetchLiveBases() {
  const res = await fetch(DATA_URL)
  if (!res.ok) {
    throw new Error(`Failed to fetch live cedears.json: ${res.status}`)
  }
  const rows = await res.json()
  if (!Array.isArray(rows)) {
    throw new Error("Live cedears.json is not an array")
  }
  const byTicker = new Map()
  for (const row of rows) {
    const ticker = String(row?.Cedears ?? "")
      .trim()
      .toUpperCase()
    if (!ticker) continue
    byTicker.set(ticker, {
      name: String(row?.Name ?? "").trim(),
      ratio: String(row?.Ratio ?? "").trim(),
      tickerOriginal:
        String(row?.TickerOriginal ?? "").trim().toUpperCase() || ticker,
    })
  }
  return byTicker
}

async function main() {
  const argentoRepo = ensureArgentoRepo()
  const detected = firstAppearanceDates(argentoRepo)
  const live = await fetchLiveBases()

  const entries = []
  for (const [ticker, detectedSince] of detected) {
    const meta = live.get(ticker)
    if (!meta) continue
    entries.push({
      ticker,
      name: meta.name,
      ratio: meta.ratio,
      tickerOriginal: meta.tickerOriginal,
      detectedSince,
    })
  }
  entries.sort((a, b) => {
    const byDate = b.detectedSince.localeCompare(a.detectedSince)
    if (byDate !== 0) return byDate
    return a.ticker.localeCompare(b.ticker)
  })

  const payload = {
    method: "git-first-appearance",
    sourceRepository: SOURCE_REPO,
    sourcePath: SOURCE_PATH,
    generatedAt: new Date().toISOString(),
    note:
      "Fechas aproximadas: primera aparición del ticker en el historial git del listado público google-sheets-argento. No reemplaza una fecha oficial de alta en BYMA o CNV.",
    entries,
  }

  await mkdir(dirname(OUT_PATH), { recursive: true })
  await writeFile(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
  console.log(`Wrote ${entries.length} entries to ${OUT_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
