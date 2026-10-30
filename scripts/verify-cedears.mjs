#!/usr/bin/env node
/**
 * End-to-end verification harness for cedears (dev server or existing base URL).
 * Usage: node scripts/verify-cedears.mjs [--mode dev|workers] [--base-url URL] [--artifact-dir DIR]
 */

import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdir, writeFile, copyFile } from "node:fs/promises"
import { createWriteStream } from "node:fs"
import http from "node:http"
import https from "node:https"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, "..")

/** Production canonical origin (local dev still emits these via wrangler vars). */
const PRODUCTION_CANONICAL_ORIGIN = (
  process.env.VERIFY_CANONICAL_ORIGIN ?? "https://cedears.com"
).replace(/\/$/, "")

const RUN_ID =
  process.env.VERIFY_RUN_ID ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

function parseArgs(argv) {
  const opts = {
    mode: "dev",
    baseUrl: process.env.VERIFY_BASE_URL ?? "",
    artifactDir:
      process.env.VERIFY_ARTIFACT_DIR ??
      join(REPO_ROOT, ".verify-artifacts", RUN_ID),
    port: Number(process.env.VERIFY_PORT ?? "3010"),
    screenshots: true,
    skipLaunch: Boolean(process.env.VERIFY_BASE_URL),
  }
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--mode" && argv[i + 1]) opts.mode = argv[++i]
    else if (arg === "--base-url" && argv[i + 1]) {
      opts.baseUrl = argv[++i]
      opts.skipLaunch = true
    } else if (arg === "--artifact-dir" && argv[i + 1])
      opts.artifactDir = argv[++i]
    else if (arg === "--port" && argv[i + 1]) opts.port = Number(argv[++i])
    else if (arg === "--no-screenshots") opts.screenshots = false
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/verify-cedears.mjs [options]

Options:
  --mode dev|workers     How to launch when --base-url is omitted (default: dev)
  --base-url URL         Use an already-running instance (skips launch/teardown)
  --artifact-dir DIR     Proof output directory
  --port N               Port when launching locally (default: 3010)
  --no-screenshots       Skip Playwright desktop/mobile captures

Env: VERIFY_BASE_URL, VERIFY_ARTIFACT_DIR, VERIFY_PORT, VERIFY_RUN_ID, VERIFY_CANONICAL_ORIGIN
`)
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  if (!opts.baseUrl) {
    opts.baseUrl = `http://127.0.0.1:${opts.port}`
  }
  return opts
}

function fetchUrl(url, { timeoutMs = 60_000 } = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http
    const req = lib.get(url, { timeout: timeoutMs }, (res) => {
      const chunks = []
      res.on("data", (c) => chunks.push(c))
      res.on("end", () => {
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers,
          body: Buffer.concat(chunks),
        })
      })
    })
    req.on("error", reject)
    req.on("timeout", () => {
      req.destroy()
      reject(new Error(`Timeout fetching ${url}`))
    })
  })
}

async function waitForReady(baseUrl, logPath, maxWaitMs = 180_000) {
  const start = Date.now()
  let lastErr = ""
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetchUrl(baseUrl)
      if (res.status >= 200 && res.status < 500) {
        return
      }
      lastErr = `status ${res.status}`
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err)
    }
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new Error(
    `Server not ready at ${baseUrl} after ${maxWaitMs}ms (last: ${lastErr}). See ${logPath}`,
  )
}

function launchServer(opts) {
  const logPath = join(opts.artifactDir, "server.log")
  const logStream = createWriteStream(logPath, { flags: "a" })
  const cmd = opts.mode === "workers" ? "pnpm" : "pnpm"
  const args =
    opts.mode === "workers"
      ? ["start", "--", "--port", String(opts.port)]
      : ["dev", "-p", String(opts.port), "-H", "127.0.0.1"]
  const child = spawn(cmd, args, {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      PORT: String(opts.port),
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  })
  child.stdout.pipe(logStream)
  child.stderr.pipe(logStream)
  return { child, logPath, logStream }
}

async function stopLaunchedServer(child, logStream) {
  if (!child) return

  const waitForExit = new Promise((resolve) => {
    if (child.exitCode !== null) {
      resolve()
      return
    }
    child.once("exit", () => resolve())
  })

  const killProcessTree = (signal) => {
    try {
      if (process.platform !== "win32" && child.pid) {
        process.kill(-child.pid, signal)
      } else {
        child.kill(signal)
      }
    } catch {
      try {
        child.kill(signal)
      } catch {
        /* already gone */
      }
    }
  }

  killProcessTree("SIGTERM")
  await Promise.race([
    waitForExit,
    new Promise((r) => setTimeout(r, 5000)),
  ])
  if (child.exitCode === null) {
    killProcessTree("SIGKILL")
    await Promise.race([
      waitForExit,
      new Promise((r) => setTimeout(r, 2000)),
    ])
  }

  if (logStream && !logStream.closed) {
    await new Promise((resolve) => logStream.end(resolve))
  }
}

async function doctor(baseUrl, artifactDir) {
  const lines = []
  const push = (ok, msg) => {
    lines.push(`${ok ? "ok" : "FAIL"}: ${msg}`)
    if (!ok) throw new Error(msg)
  }

  const home = await fetchUrl(baseUrl)
  push(home.status === 200, `GET / → ${home.status}`)
  const html = home.body.toString("utf8")
  push(
    html.includes("Listado de CEDEARs en Argentina") ||
      html.includes("Listado completo de CEDEARs"),
    "home HTML contains site title",
  )

  const dataFailed = html.includes("Error al cargar los datos")
  if (dataFailed) {
    lines.push(
      "warn: home shows data load error (GitHub/network); table smoke may be limited",
    )
  } else {
    push(html.includes("Buscar CEDEARs"), 'home has search input (aria "Buscar CEDEARs")')
  }

  const jsonRes = await fetchUrl(`${baseUrl}/cedears.json`)
  push(jsonRes.status === 200, `GET /cedears.json → ${jsonRes.status}`)
  let sampleTicker = "AAPL"
  if (jsonRes.status === 200) {
    const bases = JSON.parse(jsonRes.body.toString("utf8"))
    push(Array.isArray(bases) && bases.length > 0, "cedears.json is non-empty array")
    if (bases[0]?.Cedears) sampleTicker = String(bases[0].Cedears)
  }

  await writeFile(join(artifactDir, "doctor.txt"), lines.join("\n") + "\n", "utf8")
  return { sampleTicker, dataLoadWarning: dataFailed }
}

function extractCanonicalHref(html) {
  const m1 = html.match(
    /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i,
  )
  if (m1) return m1[1]
  const m2 = html.match(
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i,
  )
  return m2?.[1] ?? null
}

function isCanonicalInHead(html) {
  const idx = html.search(/<link[^>]+rel=["']canonical["']/i)
  if (idx === -1) return false
  const headEnd = html.indexOf("</head>")
  return headEnd !== -1 && idx < headEnd
}

function normalizeCanonicalUrl(url) {
  try {
    const parsed = new URL(url)
    parsed.hash = ""
    if (parsed.pathname === "/") {
      return `${parsed.origin}/`
    }
    parsed.pathname = parsed.pathname.replace(/\/$/, "") || "/"
    return parsed.toString()
  } catch {
    return url
  }
}

async function smokeCanonicals(baseUrl, sampleTicker, artifactDir) {
  const canonicalOrigin = PRODUCTION_CANONICAL_ORIGIN
  const checks = [
    { path: "/", expected: `${canonicalOrigin}/` },
    { path: "/categorias", expected: `${canonicalOrigin}/categorias` },
    {
      path: "/categoria/tecnologia",
      expected: `${canonicalOrigin}/categoria/tecnologia`,
    },
    {
      path: `/cedear/${encodeURIComponent(sampleTicker)}`,
      expected: `${canonicalOrigin}/cedear/${encodeURIComponent(sampleTicker)}`,
    },
  ]
  const results = []
  for (const check of checks) {
    const res = await fetchUrl(`${baseUrl}${check.path}`)
    const html = res.body.toString("utf8")
    const href = extractCanonicalHref(html)
    const inHead = isCanonicalInHead(html)
    const ok =
      res.status === 200 &&
      inHead &&
      href !== null &&
      normalizeCanonicalUrl(href) === normalizeCanonicalUrl(check.expected)
    results.push({
      path: check.path,
      expected: check.expected,
      href,
      inHead,
      ok,
    })
    if (!ok) {
      throw new Error(
        `Canonical smoke failed ${check.path}: inHead=${inHead} href=${href} expected=${check.expected}`,
      )
    }
  }
  await writeFile(
    join(artifactDir, "canonical-smoke.json"),
    JSON.stringify({ baseUrl, canonicalOrigin, results }, null, 2),
    "utf8",
  )
}

const SMOKE_ROUTES = [
  { path: "/", expectStatus: 200 },
  { path: "/portfolio", expectStatus: 200 },
  { path: "/categorias", expectStatus: 200 },
  { path: "/herramientas", expectStatus: 200 },
  { path: "/herramientas/dca", expectStatus: 200 },
  { path: "/herramientas/rebalanceo", expectStatus: 200 },
  { path: "/alycs", expectStatus: 200 },
  { path: "/dolar-mep", expectStatus: 200 },
  { path: "/dolar-cable", expectStatus: 200 },
  { path: "/ratios", expectStatus: 200 },
  { path: "/ratios.csv", expectStatus: 200, contentTypeIncludes: "text/csv" },
  { path: "/earnings", expectStatus: 200 },
  { path: "/dividendos", expectStatus: 200, timeoutMs: 600_000 },
  { path: "/dividendos.csv", expectStatus: 200, contentTypeIncludes: "text/csv", timeoutMs: 120_000 },
  { path: "/cedears.csv", expectStatus: 200, contentTypeIncludes: "text/csv" },
  { path: "/cedears.md", expectStatus: 200 },
  { path: "/sitemap.xml", expectStatus: 200 },
]

function requestUrl(url, { method = "GET", headers = {}, body, timeoutMs = 60_000 } = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http
    const req = lib.request(url, { method, headers, timeout: timeoutMs }, (res) => {
      const chunks = []
      res.on("data", (c) => chunks.push(c))
      res.on("end", () =>
        resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") }),
      )
    })
    req.on("error", reject)
    req.on("timeout", () => { req.destroy(); reject(new Error(`Timeout ${url}`)) })
    if (body) req.write(body)
    req.end()
  })
}

async function smokeMcp(baseUrl) {
  const html = await requestUrl(`${baseUrl}/mcp`, { headers: { Accept: "text/html" } })
  assert.equal(html.status, 200, "GET /mcp (html)")
  assert.ok((html.headers["content-type"] ?? "").includes("text/html"), "/mcp html content-type")
  assert.ok(html.body.includes("Conectá cedears.com a tu asistente de IA"), "/mcp docs h1")
  assert.ok(html.body.includes('"FAQPage"'), "/mcp FAQPage JSON-LD")
  assert.ok(html.body.includes("sin fecha propia"), "/mcp FAQ datos actualizados copy")
  assert.ok(!html.body.includes("Cada respuesta del servidor indica su fecha"), "/mcp old FAQ copy removed")
  const sse = await requestUrl(`${baseUrl}/mcp`, { headers: { Accept: "text/html, text/event-stream" } })
  assert.equal(sse.status, 405, "GET /mcp with text/event-stream keeps MCP 405")
  const json = await requestUrl(`${baseUrl}/mcp`, { headers: { Accept: "application/json" } })
  assert.equal(json.status, 200, "GET /mcp (json)")
  assert.deepEqual(JSON.parse(json.body).tools, ["list_cedears", "get_cedear", "earnings"])
  const bare = await requestUrl(`${baseUrl}/mcp`)
  assert.ok((bare.headers["content-type"] ?? "").includes("application/json"), "GET /mcp no Accept stays JSON")
  const rpc = await requestUrl(`${baseUrl}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  })
  assert.equal(rpc.status, 200, "POST /mcp tools/list")
  assert.equal(JSON.parse(rpc.body).result.tools.length, 3)
  const sitemap = await requestUrl(`${baseUrl}/sitemap.xml`)
  for (const path of ["/ratios", "/dividendos", "/mcp"]) {
    assert.ok(sitemap.body.includes(`${path}</loc>`), `sitemap includes ${path}`)
  }
}

async function smoke(baseUrl, sampleTicker, artifactDir) {
  const results = []
  for (const route of SMOKE_ROUTES) {
    const url = `${baseUrl}${route.path}`
    const res = await fetchUrl(url, { timeoutMs: route.timeoutMs ?? 60_000 })
    const okStatus = res.status === route.expectStatus
    const ct = res.headers["content-type"] ?? ""
    const okCt =
      !route.contentTypeIncludes ||
      ct.includes(route.contentTypeIncludes)
    const ok = okStatus && okCt
    results.push({
      path: route.path,
      status: res.status,
      contentType: ct,
      ok,
    })
    if (!ok) {
      throw new Error(
        `Smoke failed ${route.path}: status=${res.status} content-type=${ct}`,
      )
    }
  }
  const detailPath = `/cedear/${encodeURIComponent(sampleTicker)}`
  const detail = await fetchUrl(`${baseUrl}${detailPath}`)
  assert.equal(detail.status, 200, `GET ${detailPath}`)
  results.push({ path: detailPath, status: detail.status, ok: true })

  await writeFile(
    join(artifactDir, "smoke.json"),
    JSON.stringify({ baseUrl, sampleTicker, results }, null, 2),
    "utf8",
  )

  await smokeCanonicals(baseUrl, sampleTicker, artifactDir)
  await smokeMcp(baseUrl)
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth > doc.clientWidth + 1
  })
  assert.equal(
    overflow,
    false,
    `${label}: horizontal overflow (scrollWidth > clientWidth)`,
  )
}

async function assertRatiosPageGeometry(baseUrl, page, viewportLabel) {
  const width = viewportLabel === "375" ? 375 : 390
  await page.setViewportSize({ width, height: 844 })
  await page.goto(`${baseUrl}/ratios`, {
    waitUntil: "networkidle",
    timeout: 120_000,
  })

  const atTop = await page.evaluate(() => {
    const wrap = document.querySelector("[data-ratios-table-wrap]")
    const thead = document.querySelector("[data-ratios-table] thead")
    const firstRow = document.querySelector(
      "[data-ratios-table] tbody tr:first-child",
    )
    const csv = document.getElementById("ratios-download-csv")
    const mainPad =
      Number.parseFloat(
        getComputedStyle(document.querySelector("main") ?? document.body)
          .paddingLeft,
      ) || 0

    const wrapRect = wrap?.getBoundingClientRect()
    const theadRect = thead?.getBoundingClientRect()
    const firstRect = firstRow?.getBoundingClientRect()
    const csvRect = csv?.getBoundingClientRect()
    const vp = document.documentElement.clientWidth

    const gapAboveThead =
      wrapRect && theadRect ? theadRect.top - wrapRect.top : Number.NaN
    const headerAboveFirst =
      theadRect && firstRect
        ? theadRect.bottom <= firstRect.top + 1
        : false
    const tableInnerWidth =
      document.querySelector("[data-ratios-table]")?.getBoundingClientRect()
        .width ?? 0
    const maxInner = vp - mainPad * 2
    const wrapRightInside =
      wrapRect !== undefined ? wrapRect.right <= vp - mainPad + 0.5 : false
    const csvTouchHeight = csvRect?.height ?? 0

    return {
      gapAboveThead,
      headerAboveFirst,
      tableInnerWidth,
      maxInner,
      wrapRightInside,
      wrapWidth: wrapRect?.width ?? 0,
      csvTouchHeight,
    }
  })

  assert.ok(
    atTop.gapAboveThead <= 2,
    `${viewportLabel}: gap above thead in table wrap (${atTop.gapAboveThead}px)`,
  )
  assert.equal(
    atTop.headerAboveFirst,
    true,
    `${viewportLabel}: thead must sit above first tbody row at scroll 0`,
  )
  assert.ok(
    atTop.tableInnerWidth <= atTop.maxInner + 0.5,
    `${viewportLabel}: table width ${atTop.tableInnerWidth} exceeds content ${atTop.maxInner}`,
  )
  assert.equal(
    atTop.wrapRightInside,
    true,
    `${viewportLabel}: table wrap right edge must stay inside viewport padding`,
  )
  assert.ok(
    atTop.csvTouchHeight >= 44,
    `${viewportLabel}: Descargar CSV touch height ${atTop.csvTouchHeight}px`,
  )

  await page.evaluate(() => window.scrollTo(0, 1200))
  await page.waitForTimeout(200)

  const scrolled = await page.evaluate(() => {
    const search = document.getElementById("ratios-search-sticky")
    const th = document.querySelector(
      "[data-ratios-table] thead th:not(.hidden)",
    )
    const searchRect = search?.getBoundingClientRect()
    const thRect = th?.getBoundingClientRect()
    const stuckBelowSearch =
      searchRect && thRect
        ? Math.abs(thRect.top - searchRect.bottom) <= 2
        : false
    return { stuckBelowSearch, thTop: thRect?.top, searchBottom: searchRect?.bottom }
  })

  assert.equal(
    scrolled.stuckBelowSearch,
    true,
    `${viewportLabel}: sticky th must align below search (th.top=${scrolled.thTop}, search.bottom=${scrolled.searchBottom})`,
  )
}

async function assertDividendosTableFitsContainer(page, label) {
  const result = await page.evaluate(() => {
    const heading = document.getElementById("dividendos-table-heading")
    const section = heading?.closest("section")
    const table = section?.querySelector(".overflow-x-auto table")
    const wrapper = table?.closest(".overflow-x-auto")
    if (!wrapper || !table) {
      return { ok: false, reason: "missing table or wrapper" }
    }
    return {
      ok: table.scrollWidth <= wrapper.clientWidth + 1,
      tableWidth: table.scrollWidth,
      containerWidth: wrapper.clientWidth,
    }
  })
  assert.equal(
    result.ok,
    true,
    `${label}: dividendos table wider than container (${result.tableWidth ?? "?"}px > ${result.containerWidth ?? "?"}px)${result.reason ? ` — ${result.reason}` : ""}`,
  )
}

async function assertNoHydrationErrors(page, label) {
  await page.waitForTimeout(300)
  const errors = await page.evaluate(() => {
    return window.__cedearsHydrationErrors ?? []
  })
  assert.equal(
    errors.length,
    0,
    `${label}: hydration errors in console: ${errors.join(" | ")}`,
  )
}

function attachHydrationListeners(page) {
  page.addInitScript(() => {
    window.__cedearsHydrationErrors = []
  })
  page.on("console", (msg) => {
    if (msg.type() !== "error") return
    const text = msg.text()
    if (/hydrat/i.test(text) || /did not match/i.test(text)) {
      page
        .evaluate((entry) => {
          window.__cedearsHydrationErrors?.push(entry)
        }, text)
        .catch(() => {})
    }
  })
  page.on("pageerror", (err) => {
    const text = String(err)
    if (/hydrat/i.test(text)) {
      page
        .evaluate((entry) => {
          window.__cedearsHydrationErrors?.push(entry)
        }, text)
        .catch(() => {})
    }
  })
}

async function captureMcpScreenshots(baseUrl, artifactDir, browser) {
  for (const width of [390, 768, 1024, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.goto(`${baseUrl}/mcp`, { waitUntil: "networkidle", timeout: 120_000 })
    await page.waitForSelector("h1")
    await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)))
    await assertNoHorizontalOverflow(page, `mcp ${width}px`)
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("main section button, main section summary, main header:has(h1) button")]
        .filter((el) => el.getBoundingClientRect().height < 44)
        .map((el) => el.textContent?.trim().slice(0, 40)),
    )
    assert.deepEqual(small, [], `mcp ${width}px: touch targets < 44px`)
    await page.screenshot({ path: join(artifactDir, `mcp-${width}.png`), fullPage: true })
    await page.close()
  }
}

async function captureDividendosScreenshots(baseUrl, artifactDir, browser) {
  const capture = async (page, url, filename, label, options = {}) => {
    const { checkTableWidth = false } = options
    attachHydrationListeners(page)
    await page.goto(url, { waitUntil: "networkidle", timeout: 600_000 })
    await page.waitForSelector("input#dividendos-search", {
      timeout: 600_000,
    })
    if (checkTableWidth) {
      await page.waitForSelector(
        "section:has(#dividendos-table-heading) .overflow-x-auto table",
        { timeout: 600_000 },
      )
    }
    await assertNoHorizontalOverflow(page, label)
    if (checkTableWidth) {
      await assertDividendosTableFitsContainer(page, label)
    }
    await assertNoHydrationErrors(page, label)
    await page.screenshot({ path: join(artifactDir, filename), fullPage: false })
  }

  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  })
  await capture(
    desktop,
    `${baseUrl}/dividendos`,
    "dividendos-desktop-1440.png",
    "dividendos 1440px",
  )

  const tabletLg = await browser.newPage({
    viewport: { width: 1024, height: 768 },
  })
  await capture(
    tabletLg,
    `${baseUrl}/dividendos`,
    "dividendos-tablet-1024.png",
    "dividendos 1024px",
    { checkTableWidth: true },
  )

  const tabletMd = await browser.newPage({
    viewport: { width: 768, height: 1024 },
  })
  await capture(
    tabletMd,
    `${baseUrl}/dividendos`,
    "dividendos-tablet-768.png",
    "dividendos 768px",
    { checkTableWidth: true },
  )

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
  })
  await capture(
    mobile,
    `${baseUrl}/dividendos`,
    "dividendos-mobile-390.png",
    "dividendos 390px",
  )

  const mobileFilter = await browser.newPage({
    viewport: { width: 390, height: 844 },
  })
  await capture(
    mobileFilter,
    `${baseUrl}/dividendos?frecuencia=mensual`,
    "dividendos-mobile-390-frecuencia.png",
    "dividendos 390px frecuencia",
  )

  const mobileEmpty = await browser.newPage({
    viewport: { width: 390, height: 844 },
  })
  attachHydrationListeners(mobileEmpty)
  await mobileEmpty.goto(`${baseUrl}/dividendos`, {
    waitUntil: "networkidle",
    timeout: 600_000,
  })
  const search = mobileEmpty.getByRole("searchbox", { name: "Buscar CEDEAR" })
  await search.waitFor({ state: "visible", timeout: 600_000 })
  await search.fill("zzz")
  await mobileEmpty.waitForTimeout(800)
  await assertNoHorizontalOverflow(mobileEmpty, "dividendos 390px sin resultados")
  await assertNoHydrationErrors(mobileEmpty, "dividendos 390px sin resultados")
  await mobileEmpty.screenshot({
    path: join(artifactDir, "dividendos-mobile-390-sin-resultados.png"),
    fullPage: false,
  })

  const mobile375 = await browser.newPage({
    viewport: { width: 375, height: 812 },
  })
  await capture(
    mobile375,
    `${baseUrl}/dividendos`,
    "dividendos-mobile-375.png",
    "dividendos 375px",
  )

  const agentStoreDir = join(
    process.env.VERIFY_AGENT_STORE_DIR ?? "/cursor/stores/self",
    "pr72",
  )
  try {
    await mkdir(agentStoreDir, { recursive: true })
  } catch (err) {
    console.warn(`skip agent store copy (${err.code ?? err})`)
    return
  }
  const pr72Captures = [
    "dividendos-mobile-390.png",
    "dividendos-tablet-768.png",
    "dividendos-tablet-1024.png",
    "dividendos-desktop-1440.png",
  ]
  for (const name of pr72Captures) {
    await copyFile(join(artifactDir, name), join(agentStoreDir, name))
  }
}

async function captureScreenshots(baseUrl, artifactDir, setBrowser) {
  const { chromium, devices } = await import("playwright")
  const browser = await chromium.launch({ headless: true })
  setBrowser?.(browser)
  try {
    const desktop = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    })
    await desktop.goto(baseUrl, { waitUntil: "networkidle", timeout: 120_000 })
    await desktop.screenshot({
      path: join(artifactDir, "home-desktop.png"),
      fullPage: false,
    })
    const search = desktop.getByRole("searchbox", { name: "Buscar CEDEARs" })
    if (await search.count()) {
      await search.first().focus()
      await search.first().fill("AAPL")
      await desktop.waitForTimeout(2000)
      await desktop.screenshot({
        path: join(artifactDir, "home-search-desktop.png"),
        fullPage: false,
      })
    }

    const wide = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    })
    await wide.goto(baseUrl, { waitUntil: "networkidle", timeout: 120_000 })
    await assertNoHorizontalOverflow(wide, "home 1440px")
    await wide.screenshot({
      path: join(artifactDir, "home-1440.png"),
      fullPage: false,
    })

    const narrow = await browser.newPage({
      viewport: { width: 390, height: 844 },
    })
    await narrow.goto(baseUrl, { waitUntil: "networkidle", timeout: 120_000 })
    await assertNoHorizontalOverflow(narrow, "home 390px")
    await narrow.screenshot({
      path: join(artifactDir, "home-390.png"),
      fullPage: false,
    })

    const iphone = devices["iPhone 13"]
    const mobile = await browser.newPage({ ...iphone })
    await mobile.goto(baseUrl, { waitUntil: "networkidle", timeout: 120_000 })
    await assertNoHorizontalOverflow(mobile, "home iPhone 13")
    await mobile.screenshot({
      path: join(artifactDir, "home-mobile.png"),
      fullPage: false,
    })

    const ratiosDesktop = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    })
    await ratiosDesktop.goto(`${baseUrl}/ratios`, {
      waitUntil: "networkidle",
      timeout: 120_000,
    })
    await assertNoHorizontalOverflow(ratiosDesktop, "ratios 1440px")
    await ratiosDesktop.screenshot({
      path: join(artifactDir, "ratios-desktop-1440.png"),
      fullPage: false,
    })

    const ratiosMobile = await browser.newPage({
      viewport: { width: 390, height: 844 },
    })
    await ratiosMobile.goto(`${baseUrl}/ratios`, {
      waitUntil: "networkidle",
      timeout: 120_000,
    })
    await assertNoHorizontalOverflow(ratiosMobile, "ratios 390px")
    await assertRatiosPageGeometry(baseUrl, ratiosMobile, "390")
    await ratiosMobile.evaluate(() => window.scrollTo(0, 0))
    await ratiosMobile.screenshot({
      path: join(artifactDir, "ratios-mobile-390.png"),
      fullPage: false,
    })
    await ratiosMobile.evaluate(() => window.scrollTo(0, 1200))
    await ratiosMobile.waitForTimeout(200)
    await ratiosMobile.screenshot({
      path: join(artifactDir, "ratios-mobile-390-scrolled.png"),
      fullPage: false,
    })

    const ratios375 = await browser.newPage({
      viewport: { width: 375, height: 812 },
    })
    await ratios375.goto(`${baseUrl}/ratios`, {
      waitUntil: "networkidle",
      timeout: 120_000,
    })
    await assertNoHorizontalOverflow(ratios375, "ratios 375px")
    await assertRatiosPageGeometry(baseUrl, ratios375, "375")

    await captureMcpScreenshots(baseUrl, artifactDir, browser)
    await captureDividendosScreenshots(baseUrl, artifactDir, browser)
  } finally {
    await browser.close()
    setBrowser?.(null)
  }
}

async function main() {
  const opts = parseArgs(process.argv)
  await mkdir(opts.artifactDir, { recursive: true })

  let child = null
  let logStream = null
  let browser = null
  const meta = {
    runId: RUN_ID,
    mode: opts.mode,
    baseUrl: opts.baseUrl,
    artifactDir: opts.artifactDir,
    launched: false,
  }

  console.log(`verify-cedears run=${RUN_ID}`)
  console.log(`artifacts → ${opts.artifactDir}`)

  try {
    if (!opts.skipLaunch) {
      if (opts.mode === "workers") {
        console.log("Building for workers preview (pnpm build)…")
        await new Promise((resolve, reject) => {
          const b = spawn("pnpm", ["build"], {
            cwd: REPO_ROOT,
            stdio: "inherit",
          })
          b.on("exit", (code) =>
            code === 0 ? resolve() : reject(new Error(`pnpm build exited ${code}`)),
          )
        })
      }
      console.log(`Launching ${opts.mode} at ${opts.baseUrl}…`)
      const launched = launchServer(opts)
      child = launched.child
      logStream = launched.logStream
      meta.launched = true
      await waitForReady(opts.baseUrl, launched.logPath)
    }

    console.log("Doctor…")
    const { sampleTicker, dataLoadWarning } = await doctor(
      opts.baseUrl,
      opts.artifactDir,
    )
    if (dataLoadWarning) console.log("Doctor warning: upstream CEDEAR data unavailable")

    console.log("Smoke HTTP…")
    await smoke(opts.baseUrl, sampleTicker, opts.artifactDir)

    if (opts.screenshots) {
      console.log("Screenshots (Playwright)…")
      await captureScreenshots(opts.baseUrl, opts.artifactDir, (b) => {
        browser = b
      })
    }

    meta.sampleTicker = sampleTicker
    meta.finishedAt = new Date().toISOString()
    meta.ok = true
    await writeFile(
      join(opts.artifactDir, "summary.json"),
      JSON.stringify(meta, null, 2),
      "utf8",
    )
    console.log("verify-cedears: PASS")
  } catch (err) {
    meta.ok = false
    meta.error = err instanceof Error ? err.message : String(err)
    await writeFile(
      join(opts.artifactDir, "summary.json"),
      JSON.stringify(meta, null, 2),
      "utf8",
    ).catch(() => {})
    console.error("verify-cedears: FAIL", meta.error)
    process.exitCode = 1
  } finally {
    if (browser) {
      await browser.close().catch(() => {})
      browser = null
    }
    await stopLaunchedServer(child, logStream)
    const code = process.exitCode ?? (meta.ok === false ? 1 : 0)
    process.exit(code)
  }
}

main()
