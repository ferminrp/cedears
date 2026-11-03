#!/usr/bin/env node
/**
 * Measure client-style RSC navigation timings against a base URL.
 * Usage: node scripts/measure-rsc-nav.mjs --base https://cedears.com [--runs 5]
 */
import { chromium } from "playwright"

const routes = [
  "/",
  "/portfolio",
  "/categorias",
  "/categoria/tecnologia",
  "/ratios",
  "/herramientas",
  "/alycs",
  "/dolar-mep",
  "/dolar-cable",
  "/earnings",
  "/dividendos",
]

function median(nums) {
  const s = [...nums].sort((a, b) => a - b)
  if (s.length === 0) return null
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function parseArgs(argv) {
  const args = { base: "https://cedears.com", runs: 5, from: "/" }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--base") args.base = argv[++i]
    else if (argv[i] === "--runs") args.runs = Number(argv[++i])
    else if (argv[i] === "--from") args.from = argv[++i]
  }
  return args
}

async function measureRscFetch(page, base, path, stateTree) {
  const url = new URL(path, base)
  url.searchParams.set("_rsc", "bench")
  const started = performance.now()
  const res = await page.request.fetch(url.toString(), {
    headers: {
      RSC: "1",
      Accept: "text/x-component",
      "Next-Router-State-Tree": stateTree,
      "Next-Url": path,
    },
  })
  const ttfbMs = performance.now() - started
  const body = await res.body()
  const headers = res.headers()
  return {
    status: res.status(),
    ttfbMs,
    bytes: body.length,
    cache: headers["x-vinext-cache"] ?? headers["x-nextjs-cache"] ?? "",
    cfCache: headers["cf-cache-status"] ?? "",
    cdnControl: headers["cdn-cache-control"] ?? headers["cache-control"] ?? "",
  }
}

async function measureClientNav(page, path) {
  const start = Date.now()
  await page.locator('nav[aria-label="Secciones"] a').filter({ hasText: /.+/ }).first().waitFor()
  const link = page.locator(`nav[aria-label="Secciones"] a[href="${path}"]`).first()
  await link.click()
  const navUrlMatch =
    path === "/"
      ? (url) => {
          const p = new URL(url).pathname
          return p === "/" || p === ""
        }
      : `**${path}**`
  await page.waitForURL(navUrlMatch, { timeout: 120_000 })
  await page.locator("h1").first().waitFor({ state: "visible", timeout: 120_000 })
  const skeletonBusy = await page.locator('[aria-busy="true"]').count()
  return { navMs: Date.now() - start, skeletonBusyAtEnd: skeletonBusy }
}

async function main() {
  const { base, runs, from } = parseArgs(process.argv)
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(new URL(from, base).toString(), { waitUntil: "networkidle", timeout: 120_000 })

  let stateTree = ""
  page.on("request", (req) => {
    const h = req.headers()["next-router-state-tree"]
    if (h && req.url().includes("_rsc=")) stateTree = h
  })
  await page.goto(new URL("/ratios", base).toString(), { waitUntil: "commit", timeout: 120_000 })
  if (!stateTree) {
    stateTree = encodeURIComponent(JSON.stringify(["", { children: ["(site)", { children: ["__PAGE__", {}, null, null] }, null, null] }]))
  }

  const rscResults = {}
  for (const path of routes) {
    const samples = []
    for (let i = 0; i < runs; i++) {
      samples.push(await measureRscFetch(page, base, path, stateTree))
      await new Promise((r) => setTimeout(r, 200))
    }
    rscResults[path] = {
      ttfbMedianMs: median(samples.map((s) => s.ttfbMs)),
      bytesMedian: median(samples.map((s) => s.bytes)),
      status: samples[0]?.status,
      cacheSample: samples.map((s) => s.cache).filter(Boolean).join("|") || "—",
      cfCacheSample: samples[0]?.cfCache,
      coldWarm: { first: samples[0]?.ttfbMs, last: samples[samples.length - 1]?.ttfbMs },
    }
  }

  await page.goto(new URL(from, base).toString(), { waitUntil: "networkidle", timeout: 120_000 })
  const navRoutes = ["/ratios", "/dividendos", "/categorias", "/portfolio", "/"]
  const navResults = {}
  for (const path of navRoutes) {
    const samples = []
    for (let i = 0; i < Math.min(3, runs); i++) {
      await page.goto(new URL(from, base).toString(), { waitUntil: "networkidle", timeout: 120_000 })
      samples.push(await measureClientNav(page, path))
    }
    navResults[path] = {
      navMedianMs: median(samples.map((s) => s.navMs)),
    }
  }

  await browser.close()

  console.log(JSON.stringify({ base, runs, rscResults, navResults, stateTreeCaptured: Boolean(stateTree) }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
