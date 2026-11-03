#!/usr/bin/env node
import { chromium } from "playwright"

const base = process.argv[2] ?? "https://cedears.com"
const targets = ["/ratios", "/dividendos", "/categorias"]

async function captureNav(path) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const rsc = []
  page.on("response", async (res) => {
    const url = res.url()
    if (!url.includes("_rsc=")) return
    const req = res.request()
    rsc.push({
      path,
      url: url.split("?")[0],
      status: res.status(),
      ms: (await res.request().timing().catch(() => null)) ? undefined : undefined,
      size: (await res.body().catch(() => Buffer.alloc(0))).length,
      vinextCache: res.headers()["x-vinext-cache"],
      prefetch: req.headers()["next-router-prefetch"],
    })
  })

  await page.goto(`${base}/`, { waitUntil: "networkidle" })
  const t0 = Date.now()
  await page.locator(`nav a[href="${path}"]`).first().click()
  await page.locator("h1").first().waitFor({ state: "visible", timeout: 120000 })
  const total = Date.now() - t0
  await browser.close()
  return { path, totalMs: total, rscCount: rsc.length, rsc }
}

const out = []
for (const path of targets) {
  out.push(await captureNav(path))
}
console.log(JSON.stringify(out, null, 2))
