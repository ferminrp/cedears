import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { prefersMarkdown } from "./accept-markdown.ts"
import {
  buildAgentInstructions,
  buildHomeIntro,
  buildHomeJsonLd,
  buildLlmsTxt,
  buildNotFoundMarkdown,
  isKnownPublicPath,
} from "./agent-resources.ts"
import { siteConfig } from "./site.ts"

const siteUrl = "https://cedears.com"

describe("prefersMarkdown", () => {
  it("returns false without an Accept header", () => {
    assert.equal(prefersMarkdown(null), false)
  })

  it("prefers markdown when it is the only type or beats html q-values", () => {
    assert.equal(prefersMarkdown("text/markdown"), true)
    assert.equal(prefersMarkdown("text/markdown, text/html;q=0.9"), true)
    assert.equal(prefersMarkdown("text/html, text/markdown;q=0.8"), false)
  })
})

describe("agent resources", () => {
  it("builds llms.txt with when-to-use guidance before H2 file lists", () => {
    const body = buildLlmsTxt({
      siteUrl,
      name: siteConfig.name,
      description: siteConfig.description,
    })

    assert.match(body, /^# CEDEARs Argentina\n/)
    assert.match(body, /^> /m)
    assert.match(body, /When to use this:/)
    assert.match(body, /How an agent should call this site:/)
    assert.ok(body.indexOf("When to use this:") < body.indexOf("## Datos"))
    assert.match(body, /## Optional/)
    assert.match(body, /agent-instructions\.md/)
  })

  it("names specific jobs in the dedicated agent-instructions file", () => {
    const body = buildAgentInstructions({
      siteUrl,
      brandName: siteConfig.name,
    })

    assert.match(body, /When to use this:/)
    assert.match(body, /does ticker X have a CEDEAR/)
    assert.match(body, /cedears\.json/)
    assert.match(body, /Do not use this site to place trades/)
  })

  it("returns markdown 404 recovery links", () => {
    const body = buildNotFoundMarkdown(siteUrl)
    assert.match(body, /^# 404 Not Found/)
    assert.match(body, /sitemap\.xml/)
    assert.match(body, /llms\.txt/)
    assert.match(body, /agent-instructions\.md/)
  })

  it("keeps homepage intro over 500 characters without JavaScript", () => {
    const intro = buildHomeIntro({ siteUrl, brandName: siteConfig.name })
    assert.ok(intro.length > 500)
    assert.match(intro, /CEDEARs Argentina/)
    assert.match(intro, /cedears\.com/)
  })

  it("emits Organization JSON-LD with contactPoint and PostalAddress", () => {
    const jsonLd = buildHomeJsonLd({
      siteUrl,
      cedearCount: 12,
      organization: siteConfig.organization,
    })
    const organization = jsonLd["@graph"].find(
      (node) => node["@type"] === "Organization",
    )

    assert.ok(organization)
    assert.equal(organization.name, "CEDEARs Argentina")
    assert.deepEqual(organization.alternateName, [...siteConfig.alternateNames])
    assert.equal(organization.address["@type"], "PostalAddress")
    assert.equal(organization.address.addressCountry, "AR")
    assert.equal(organization.contactPoint["@type"], "ContactPoint")
    assert.equal(organization.contactPoint.email, siteConfig.organization.email)
    assert.equal(
      organization.contactPoint.contactType,
      siteConfig.organization.contactType,
    )
  })

  it("recognizes public routes and rejects unknown paths", () => {
    assert.equal(isKnownPublicPath("/"), true)
    assert.equal(isKnownPublicPath("/cedear/AAPL"), true)
    assert.equal(isKnownPublicPath("/llms.txt"), true)
    assert.equal(isKnownPublicPath("/agent-instructions.md"), true)
    assert.equal(isKnownPublicPath("/some-path-that-does-not-exist"), false)
  })
})
