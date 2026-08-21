import { getSiteUrl, siteConfig } from "@/lib/site"
import {
  buildAgentInstructions,
  buildLlmsTxt,
  buildNotFoundMarkdown,
} from "@/lib/agent-resources"

export function llmsTxtBody() {
  return buildLlmsTxt({
    siteUrl: getSiteUrl(),
    name: siteConfig.name,
    description: siteConfig.description,
  })
}

export function agentInstructionsBody() {
  return buildAgentInstructions({
    siteUrl: getSiteUrl(),
    brandName: siteConfig.name,
  })
}

export function notFoundMarkdownBody() {
  return buildNotFoundMarkdown(getSiteUrl())
}
