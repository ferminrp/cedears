/**
 * Playwright e2e for GuideToc highlight lock/unlock.
 * Requires a running dev server: VERIFY_BASE_URL (default http://127.0.0.1:3011).
 */
import { chromium } from "playwright"

const baseUrl = process.env.VERIFY_BASE_URL ?? "http://127.0.0.1:3011"
const guidePath = "/como-comprar-cedears"

async function readActiveTocLabel(page) {
  const label = await page.evaluate(() => {
    const links = [
      ...document.querySelectorAll('nav[aria-label="Índice de la guía"] a'),
    ]
    return links.find((a) => a.getAttribute("aria-current") === "location")
      ?.textContent
      ?.trim()
  })
  return label ?? null
}

async function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function testUnlockAfterManualScroll(page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${baseUrl}${guidePath}`, { waitUntil: "networkidle" })
  await page.getByRole("link", { name: "Ratio de conversión" }).click()
  await page.waitForTimeout(400)

  await assert(
    (await readActiveTocLabel(page)) === "Ratio de conversión",
    "expected Ratio locked right after TOC click",
  )

  await page.mouse.wheel(0, 600)
  await page.waitForTimeout(350)

  const tocOrder = [
    "Resumen",
    "¿Qué es un CEDEAR?",
    "Ratio de conversión",
    "Paso a paso",
    "Costos e impuestos",
    "Dividendos",
    "Preguntas frecuentes",
  ]

  const afterWheel = await readActiveTocLabel(page)
  await assert(
    afterWheel !== "Ratio de conversión",
    "highlight stayed locked on Ratio after wheel",
  )
  await assert(
    tocOrder.indexOf(afterWheel) > tocOrder.indexOf("Ratio de conversión"),
    `expected highlight to follow scroll past Ratio, got ${afterWheel}`,
  )
}

async function testBackClearsLockWhenHashGone(page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${baseUrl}${guidePath}`, { waitUntil: "networkidle" })

  await page.getByRole("link", { name: "Ratio de conversión" }).click()
  await page.waitForTimeout(350)
  await assert(
    (await readActiveTocLabel(page)) === "Ratio de conversión",
    "expected Ratio after first TOC click",
  )

  await page.getByRole("link", { name: "Paso a paso" }).click()
  await page.waitForTimeout(350)
  await page.goBack()
  await page.waitForTimeout(350)
  await page.goBack()
  await page.waitForTimeout(350)

  const hash = await page.evaluate(() => window.location.hash)
  await assert(hash === "", `expected empty hash after two backs, got ${hash}`)

  const active = await readActiveTocLabel(page)
  await assert(
    active === "Resumen",
    `expected Resumen at top without hash, got ${active}`,
  )
}

async function testMobileUnlock(page) {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${baseUrl}${guidePath}`, { waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Índice de la guía" }).click()
  await page.getByRole("link", { name: "¿Qué es un CEDEAR?" }).click()
  await page.waitForTimeout(400)

  await assert(
    (await readActiveTocLabel(page)) === "¿Qué es un CEDEAR?",
    "mobile: expected ¿Qué es un CEDEAR? after click",
  )

  await page.mouse.wheel(0, 500)
  await page.waitForTimeout(350)

  const afterWheel = await readActiveTocLabel(page)
  await assert(
    afterWheel !== "¿Qué es un CEDEAR?",
    "mobile: highlight stayed on ¿Qué es un CEDEAR? after wheel",
  )
}

const browser = await chromium.launch()

try {
  {
    const page = await browser.newPage()
    await testUnlockAfterManualScroll(page)
    await page.close()
  }
  {
    const page = await browser.newPage()
    await testBackClearsLockWhenHashGone(page)
    await page.close()
  }
  {
    const page = await browser.newPage()
    await testMobileUnlock(page)
    await page.close()
  }
  console.log("guide-toc.playwright.mjs: PASS")
} finally {
  await browser.close()
}
