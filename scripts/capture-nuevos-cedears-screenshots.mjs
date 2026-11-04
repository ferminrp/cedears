#!/usr/bin/env node
import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"
import { join } from "node:path"

const baseUrl = process.env.VERIFY_BASE_URL ?? "http://127.0.0.1:3012"
const outDir =
  process.env.SCREENSHOT_DIR ?? "/opt/cursor/artifacts/nuevos-cedears-mocks"

const shots = [
  { name: "nuevos-cedears-1440-light", width: 1440, height: 900, colorScheme: "light" },
  { name: "nuevos-cedears-390-light", width: 390, height: 844, colorScheme: "light" },
  { name: "nuevos-cedears-1440-dark", width: 1440, height: 900, colorScheme: "dark" },
  { name: "nuevos-cedears-390-light-focus", width: 390, height: 844, colorScheme: "light", focus: true },
]

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()
for (const shot of shots) {
  const context = await browser.newContext({
    viewport: { width: shot.width, height: shot.height },
    colorScheme: shot.colorScheme,
  })
  const page = await context.newPage()
  await page.goto(`${baseUrl}/nuevos-cedears`, {
    waitUntil: "networkidle",
    timeout: 120_000,
  })
  if (shot.focus) {
    await page.locator('a[href^="/cedear/"]').first().focus()
  }
  await page.screenshot({
    path: join(outDir, `${shot.name}.png`),
    fullPage: true,
  })
  await context.close()
}
await browser.close()
console.log(`Saved screenshots to ${outDir}`)
