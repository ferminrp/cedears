#!/usr/bin/env node
/**
 * End-to-end verification harness for cedears (dev server or existing base URL).
 * Usage: node scripts/verify-cedears.mjs [--mode dev|workers] [--base-url URL] [--artifact-dir DIR]
 */

import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import { createWriteStream } from "node:fs"
import http from "node:http"
import https from "node:https"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, "..")

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

Env: VERIFY_BASE_URL, VERIFY_ARTIFACT_DIR, VERIFY_PORT, VERIFY_RUN_ID
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
      ? ["start"]
      : ["dev", "-p", String(opts.port), "-H", "127.0.0.1"]
  const child = spawn(cmd, args, {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      PORT: String(opts.port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  })
  child.stdout.pipe(logStream)
  child.stderr.pipe(logStream)
  return { child, logPath }
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
    html.includes("Listado completo de CEDEARs") ||
      html.includes("CEDEARs en Argentina"),
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
  { path: "/earnings", expectStatus: 200 },
  { path: "/cedears.csv", expectStatus: 200, contentTypeIncludes: "text/csv" },
  { path: "/cedears.md", expectStatus: 200 },
  { path: "/sitemap.xml", expectStatus: 200 },
]

async function smoke(baseUrl, sampleTicker, artifactDir) {
  const results = []
  for (const route of SMOKE_ROUTES) {
    const url = `${baseUrl}${route.path}`
    const res = await fetchUrl(url)
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
}

async function captureScreenshots(baseUrl, artifactDir) {
  const { chromium, devices } = await import("playwright")
  const browser = await chromium.launch({ headless: true })
  try {
    const desktop = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    })
    await desktop.goto(baseUrl, { waitUntil: "networkidle", timeout: 120_000 })
    await desktop.screenshot({
      path: join(artifactDir, "home-desktop.png"),
      fullPage: false,
    })
    const search = desktop.getByRole("textbox", { name: "Buscar CEDEARs" })
    if (await search.count()) {
      await search.fill("AAPL")
      await desktop.waitForTimeout(500)
      await desktop.screenshot({
        path: join(artifactDir, "home-search-desktop.png"),
        fullPage: false,
      })
    }

    const iphone = devices["iPhone 13"]
    const mobile = await browser.newPage({ ...iphone })
    await mobile.goto(baseUrl, { waitUntil: "networkidle", timeout: 120_000 })
    await mobile.screenshot({
      path: join(artifactDir, "home-mobile.png"),
      fullPage: false,
    })
  } finally {
    await browser.close()
  }
}

async function main() {
  const opts = parseArgs(process.argv)
  await mkdir(opts.artifactDir, { recursive: true })

  let child = null
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
      await captureScreenshots(opts.baseUrl, opts.artifactDir)
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
    if (child && !child.killed) {
      child.kill("SIGTERM")
      await new Promise((r) => setTimeout(r, 2000))
      if (!child.killed) child.kill("SIGKILL")
    }
  }
}

main()
