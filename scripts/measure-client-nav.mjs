#!/usr/bin/env node
/** Client nav timing: click → h1 visible, and whether skeleton appeared. */
import { chromium } from "playwright"

const base = process.argv[2] ?? "https://cedears.com"
const paths = [
  "/ratios",
  "/dividendos",
  "/categorias",
  "/portfolio",
  "/dolar-mep",
  "/earnings",
]

function median(nums) {
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

async function measurePath(page, path, runs = 3) {
  const samples = []
  for (let i = 0; i < runs; i++) {
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 120000 })
    const t0 = Date.now()
    await page.locator(`nav a[href="${path}"]`).first().click()
    await page.waitForURL(`**${path}**`, { timeout: 120000 })
    await page.locator("h1").first().waitFor({ state: "visible", timeout: 120000 })
    const navMs = Date.now() - t0
    const skeletonMs = await page.locator('[data-slot="skeleton"]').count()
    samples.push({ navMs, skeletonMs })
  }
  return {
    path,
    navMedianMs: median(samples.map((s) => s.navMs)),
    skeletonMedianMs: median(samples.map((s) => s.skeletonMs)),
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const results = []
  for (const path of paths) {
    results.push(await measurePath(page, path))
  }
  await browser.close()
  console.log(JSON.stringify({ base, results }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
