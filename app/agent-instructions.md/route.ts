import { agentInstructionsBody } from "@/lib/agent-routes"

export const revalidate = 3600

export async function GET() {
  return new Response(agentInstructionsBody(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  })
}
