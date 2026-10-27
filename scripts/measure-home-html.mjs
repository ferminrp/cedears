#!/usr/bin/env node
/**
 * Measure raw HTML weight for GET / on a running dev/preview server.
 * Usage: node scripts/measure-home-html.mjs --base-url http://127.0.0.1:3010
 */

import http from "node:http"
import https from "node:https"

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http
    const req = lib.get(url, (res) => {
      const chunks = []
      res.on("data", (c) => chunks.push(c))
      res.on("end", () =>
        resolve({
          status: res.statusCode ?? 0,
          body: Buffer.concat(chunks),
        }),
      )
    })
    req.on("error", reject)
  })
}

function parseArgs(argv) {
  let baseUrl = process.env.VERIFY_BASE_URL ?? "http://127.0.0.1:3010"
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--base-url" && argv[i + 1]) baseUrl = argv[++i]
  }
  return baseUrl.replace(/\/$/, "")
}

async function main() {
  const baseUrl = parseArgs(process.argv)
  const res = await fetchUrl(`${baseUrl}/`)
  if (res.status !== 200) {
    console.error(`GET / failed: ${res.status}`)
    process.exit(1)
  }
  const bytes = res.body.length
  const html = res.body.toString("utf8")
  const rowCount = (html.match(/aria-label="Ver detalle de /g) ?? []).length
  const azLinks = (html.match(/href="\/cedear\//g) ?? []).length

  console.log(
    JSON.stringify(
      {
        baseUrl,
        htmlBytes: bytes,
        htmlKiB: Math.round((bytes / 1024) * 10) / 10,
        htmlMiB: Math.round((bytes / (1024 * 1024)) * 1000) / 1000,
        tableRowAriaLabels: rowCount,
        cedearHrefCount: azLinks,
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
