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

function analyzeHtml(html) {
  const scripts = []
  const staticHtml = html.replace(
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    (match) => {
      const inner = match.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "")
      scripts.push(inner)
      return ""
    },
  )

  const scriptBytes = Buffer.byteLength(scripts.join(""), "utf8")
  const staticBytes = Buffer.byteLength(staticHtml, "utf8")

  const azStart = staticHtml.indexOf("indice-az-titulo")
  const azEnd = staticHtml.indexOf("sobre-cedears")
  const azSection =
    azStart >= 0 && azEnd > azStart ? staticHtml.slice(azStart, azEnd) : ""

  const tableStart = staticHtml.indexOf("cedears-home-static-table")
  const tableEnd = azStart > 0 ? azStart : staticHtml.length
  const tableSection =
    tableStart >= 0 ? staticHtml.slice(tableStart, tableEnd) : ""

  const jsonLdMatch = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i,
  )

  const rscPayloadBytes = scripts
    .filter((s) => s.includes("usPrice") || s.includes("priceMep") || s.includes('"tags"'))
    .reduce((sum, s) => sum + Buffer.byteLength(s, "utf8"), 0)

  return {
    htmlBytes: Buffer.byteLength(html, "utf8"),
    breakdown: {
      staticHtmlBytes: staticBytes,
      inlineScriptBytes: scriptBytes,
      jsonLdBytes: jsonLdMatch
        ? Buffer.byteLength(jsonLdMatch[1], "utf8")
        : 0,
      homeTableSectionBytes: Buffer.byteLength(tableSection, "utf8"),
      azIndexSectionBytes: Buffer.byteLength(azSection, "utf8"),
      rscCedearPayloadBytes: rscPayloadBytes,
    },
    tableRowAriaLabels: (staticHtml.match(/aria-label="Ver detalle de /g) ?? [])
      .length,
    cedearHrefCount: (html.match(/href="\/cedear\//g) ?? []).length,
    serializedFieldHits: {
      usPriceInScripts: scripts.join("").split("usPrice").length - 1,
      tagsInScripts: scripts.join("").split('"tags"').length - 1,
    },
  }
}

async function main() {
  const baseUrl = parseArgs(process.argv)
  const res = await fetchUrl(`${baseUrl}/`)
  if (res.status !== 200) {
    console.error(`GET / failed: ${res.status}`)
    process.exit(1)
  }
  const html = res.body.toString("utf8")
  const analyzed = analyzeHtml(html)

  console.log(
    JSON.stringify(
      {
        baseUrl,
        htmlKiB: Math.round((analyzed.htmlBytes / 1024) * 10) / 10,
        htmlMiB: Math.round((analyzed.htmlBytes / (1024 * 1024)) * 1000) / 1000,
        ...analyzed,
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
