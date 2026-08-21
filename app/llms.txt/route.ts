import { llmsTxtBody } from "@/lib/agent-routes"

export const revalidate = 3600

export async function GET() {
  return new Response(llmsTxtBody(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
